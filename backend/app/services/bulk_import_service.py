"""Bulk product import (CSV, or XLSX with embedded images).

Implements docs/BULK_IMPORT_PLAN.md (v3):

- Rows are upserted by normalized-lowercase name first, slug fallback.
- One transaction per row (savepoints are unusable: product_service calls
  db.rollback() internally on slug collisions, which would discard them).
- Images are resolved + Pillow-validated BEFORE any DB write, so a bad URL,
  corrupt file or bad embedded picture fails the row before it touches the DB.
- Blank cells on update mean "leave unchanged".
- Re-imported images replace the old ones; old files are deleted after commit.

Two file shapes are accepted:

- CSV (+ optional images ZIP), where images are ZIP filenames or public URLs.
- XLSX where pictures are embedded in ``PICTURE n`` columns of the same row;
  each picture is mapped to its product via its cell anchor (twoCellAnchor).
"""

import asyncio
import csv
import io
import ipaddress
import posixpath
import re
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx
from fastapi import UploadFile
from loguru import logger
from PIL import Image
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.datastructures import Headers

from app.db.models import Category, Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.services import product_service
from app.utils.image_processing import process_image_upload
from app.utils.image_upload import delete_image_file, upload_image_file
from app.utils.redis import cache_delete, cache_delete_pattern

MAX_CSV_BYTES = 2 * 1024 * 1024
MAX_ROWS = 50
MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_IMAGES_PER_ROW = 5
MAX_ZIP_BYTES = 60 * 1024 * 1024
MAX_ZIP_ENTRIES = 500
MAX_ZIP_UNCOMPRESSED = 300 * 1024 * 1024
MAX_REDIRECTS = 3
MAX_PIXELS = 50_000_000
IMAGE_CONCURRENCY = 5
MAX_BADGE_LEN = 100
MAX_XLSX_BYTES = 40 * 1024 * 1024

REQUIRED_HEADERS = ("name", "category", "price")
FALLBACK_CATEGORY_NAME = "Uncategorized"
FALLBACK_CATEGORY_SLUG = "uncategorized"
OPTIONAL_HEADERS = ("original_price", "stock_qty", "description", "badge", "tags", "image_files")

PICTURE_COLUMNS = tuple(f"PICTURE {n}" for n in range(1, MAX_IMAGES_PER_ROW + 1))
TEMPLATE_HEADERS = (
    "name", "category", "price", "original_price", "stock_qty",
    "description", "badge", "tags", *PICTURE_COLUMNS,
)
_PICTURE_RE = re.compile(r"^(?:picture|image)[ _]?(\d+)$")

ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
_FORMAT_CTYPE = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
_CTYPE_EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
_EXT_CTYPE = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}

TEMPLATE_XLSX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

TEMPLATE_INSTRUCTIONS = (
    "How to fill this template",
    "",
    "1. Fill one product per row on the 'Products' sheet.",
    "2. Columns marked * are required: name, category, price.",
    "3. category should match an existing category; blank or unknown ones go into 'Uncategorized' for the admin to fix later.",
    "4. original_price must be greater than or equal to price.",
    "5. stock_qty must be a whole number (leave blank = 0 for new products).",
    "6. tags are separated by a pipe: antique|festive.",
    "7. Insert each product's photos into the PICTURE 1..5 cells on that row.",
    "   Use Insert > Pictures (a floating picture) so it is pinned to the cell.",
    "   Do NOT use Excel's 'Place in Cell' option; those cannot be read.",
    "   Up to 5 pictures per product, each 5MB or smaller (JPG/PNG/WEBP).",
    "8. Maximum 50 products per file. Use one file per batch for larger lists.",
    "9. Re-uploading an existing product name updates it instead of duplicating;",
    "   blank cells on that row keep the existing value unchanged.",
)

TEMPLATE_CSV = (
    "name,category,price,original_price,stock_qty,description,badge,tags,image_files\n"
    "Blue Jhumka,Earrings,499,699,25,Cotton-lined jhumka,New Arrival,gold|festive,"
    "jhumka_front.jpg|https://cdn.example.com/jhumka_back.jpg\n"
    "Red Bangle,Bangles & Bracelets,299,,40,,Bestseller,red,a.png\n"
)


class RowError(ValueError):
    """A row-level problem: reported in the result, never crashes the import."""


@dataclass
class CategoryRef:
    id: int
    name: str
    is_active: bool


@dataclass
class RowData:
    name: str
    category_id: int | None
    price: float
    original_price: float | None = None
    stock_qty: int | None = None
    description: str | None = None
    badge: str | None = None
    tags: list[str] | None = None
    image_refs: list[str] | None = None
    embedded: list[bytes] | None = None
    category_note: str | None = None


# ---------------------------------------------------------------------------
# File parsing (CSV and XLSX)
# ---------------------------------------------------------------------------


def _norm_header(value: str) -> str:
    """Lowercase a header, tolerating a trailing '*' required-marker."""
    return value.strip().lower().removesuffix("*").strip()


def _check_headers(headers: list[str]) -> None:
    missing = [h for h in REQUIRED_HEADERS if h not in headers]
    if missing:
        raise ValueError(f"File is missing required column(s): {', '.join(missing)}")


def _finalize_rows(rows: list[dict[str, str]]) -> None:
    if len(rows) > MAX_ROWS:
        raise ValueError(f"File has {len(rows)} rows; the maximum is {MAX_ROWS} per import")
    if not rows:
        raise ValueError("File contains no data rows")


def parse_csv(data: bytes) -> list[dict[str, str]]:
    """Parse a CSV upload into rows keyed by lowercased, stripped header names."""
    if len(data) > MAX_CSV_BYTES:
        raise ValueError("CSV file is larger than 2MB")
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("CSV must be UTF-8 encoded") from exc

    try:
        dialect = csv.Sniffer().sniff(text[:4096], delimiters=",;")
    except csv.Error:
        dialect = csv.excel

    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    if not reader.fieldnames:
        raise ValueError("CSV has no header row")

    _check_headers([_norm_header(h or "") for h in reader.fieldnames])

    rows: list[dict[str, str]] = []
    for raw in reader:
        row = {
            _norm_header(str(key)): ("" if value is None else str(value)).strip()
            for key, value in raw.items()
            if key is not None
        }
        if not any(row.values()):
            continue
        rows.append(row)

    _finalize_rows(rows)
    return rows


def parse_refs(value: str) -> list[str]:
    return [part.strip() for part in value.split("|") if part.strip()]


_XL_MAIN = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
_XL_REL_DOC = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
_XL_REL_PKG = "{http://schemas.openxmlformats.org/package/2006/relationships}"
_XL_DRAW = "{http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing}"
_XL_A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"


def _col_index(ref: str) -> int:
    """'A' -> 0, 'AB' -> 27."""
    letters = re.match(r"[A-Z]+", ref.upper())
    if not letters:
        return 0
    index = 0
    for ch in letters.group(0):
        index = index * 26 + (ord(ch) - 64)
    return index - 1


def _rels_map(zf: zipfile.ZipFile, rels_path: str) -> dict[str, str]:
    if rels_path not in zf.namelist():
        return {}
    root = ET.fromstring(zf.read(rels_path))
    return {rel.get("Id"): rel.get("Target") for rel in root if rel.get("Id")}


def _part_path(base_dir: str, target: str) -> str:
    if target.startswith("/"):
        return target.lstrip("/")
    return posixpath.normpath(posixpath.join(base_dir, target))


def _xlsx_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    return ["".join(t.text or "" for t in si.iter(f"{_XL_MAIN}t")) for si in root.findall(f"{_XL_MAIN}si")]


def _xlsx_sheet_target(zf: zipfile.ZipFile) -> str:
    """Path of the 'Products' sheet, or the first sheet if none is named that."""
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = _rels_map(zf, "xl/_rels/workbook.xml.rels")
    sheets = wb.find(f"{_XL_MAIN}sheets")
    first: str | None = None
    for sheet in sheets if sheets is not None else []:
        target = rels.get(sheet.get(f"{_XL_REL_DOC}id"))
        if not target:
            continue
        path = _part_path("xl", target)
        if (sheet.get("name") or "").strip().lower() == "products":
            return path
        first = first or path
    if first is None:
        raise ValueError("The workbook has no sheets")
    return first


def _xlsx_grid(zf: zipfile.ZipFile, target: str, shared: list[str]) -> list[tuple[int, dict[int, str]]]:
    """Read a sheet into [(row_number, {col_index: value})], sorted by row."""
    root = ET.fromstring(zf.read(target))
    grid: list[tuple[int, dict[int, str]]] = []
    for pos, row in enumerate(root.iter(f"{_XL_MAIN}row"), start=1):
        cells: dict[int, str] = {}
        for c in row.findall(f"{_XL_MAIN}c"):
            t = c.get("t")
            if t == "inlineStr":
                inline = c.find(f"{_XL_MAIN}is")
                value = "".join(x.text or "" for x in inline.iter(f"{_XL_MAIN}t")) if inline is not None else ""
            else:
                v = c.find(f"{_XL_MAIN}v")
                if v is None or v.text is None:
                    value = ""
                elif t == "s":
                    idx = int(v.text)
                    value = shared[idx] if 0 <= idx < len(shared) else ""
                else:
                    value = v.text
            cells[_col_index(c.get("r") or "")] = value
        grid.append((int(row.get("r") or pos), cells))
    grid.sort(key=lambda item: item[0])
    return grid


def _xlsx_media_by_cell(zf: zipfile.ZipFile, sheet_target: str) -> dict[tuple[int, int], bytes]:
    """Map (0-based row, 0-based col) -> embedded picture bytes for one sheet."""
    sheet_dir, sheet_name = posixpath.split(sheet_target)
    sheet_root = ET.fromstring(zf.read(sheet_target))
    drawing = sheet_root.find(f"{_XL_MAIN}drawing")
    if drawing is None:
        return {}
    drawing_target = _rels_map(zf, f"{sheet_dir}/_rels/{sheet_name}.rels").get(drawing.get(f"{_XL_REL_DOC}id"))
    if not drawing_target:
        return {}
    drawing_path = _part_path(sheet_dir, drawing_target)
    drawing_dir, drawing_name = posixpath.split(drawing_path)
    rels = _rels_map(zf, f"{drawing_dir}/_rels/{drawing_name}.rels")

    images: dict[tuple[int, int], bytes] = {}
    for anchor in ET.fromstring(zf.read(drawing_path)):
        start = anchor.find(f"{_XL_DRAW}from")
        blip = anchor.find(f".//{_XL_A}blip")
        if start is None or blip is None:
            continue
        media_target = rels.get(blip.get(f"{_XL_REL_DOC}embed"))
        if not media_target:
            continue
        media_path = _part_path(drawing_dir, media_target)
        if media_path in zf.namelist():
            row = int(start.find(f"{_XL_DRAW}row").text)
            col = int(start.find(f"{_XL_DRAW}col").text)
            images[(row, col)] = zf.read(media_path)
    return images


def parse_xlsx(data: bytes) -> tuple[list[dict[str, str]], dict[int, list[bytes]]]:
    """Parse an XLSX upload into rows + embedded pictures keyed by 1-based row ordinal.

    Rows use the same lowercased headers as the CSV parser. Pictures inserted into
    PICTURE n columns are located by their cell anchor, so each product gets the
    pictures sitting on its own row (max MAX_IMAGES_PER_ROW).
    """
    if len(data) > MAX_XLSX_BYTES:
        raise ValueError("Spreadsheet is larger than 40MB")
    try:
        zf = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile as exc:
        raise ValueError("The uploaded file is not a valid .xlsx workbook") from exc

    media = [info for info in zf.infolist() if info.filename.startswith("xl/media/")]
    if len(media) > MAX_ZIP_ENTRIES:
        raise ValueError(f"The workbook embeds too many pictures (max {MAX_ZIP_ENTRIES})")
    if sum(info.file_size for info in media) > MAX_ZIP_UNCOMPRESSED:
        raise ValueError("The workbook's embedded pictures are too large once uncompressed")

    try:
        shared = _xlsx_shared_strings(zf)
        target = _xlsx_sheet_target(zf)
        grid = _xlsx_grid(zf, target, shared)
    except (ET.ParseError, KeyError) as exc:
        raise ValueError("The .xlsx workbook is malformed") from exc

    if not grid:
        raise ValueError("File has no header row")

    _, header_cells = grid[0]
    headers = {col: _norm_header(value or "") for col, value in header_cells.items()}
    _check_headers(list(headers.values()))

    picture_cols: list[tuple[int, int]] = []
    for col, name in headers.items():
        match = _PICTURE_RE.match(name)
        if match:
            picture_cols.append((int(match.group(1)), col))
    picture_cols.sort()
    anchors = _xlsx_media_by_cell(zf, target) if picture_cols else {}

    rows: list[dict[str, str]] = []
    images_by_row: dict[int, list[bytes]] = {}
    for row_number, cells in grid[1:]:
        row = {name: (cells.get(col) or "").strip() for col, name in headers.items()}
        if not any(row.values()):
            continue
        rows.append(row)
        pictures = [anchors[(row_number - 1, col)] for _, col in picture_cols if (row_number - 1, col) in anchors]
        if pictures:
            images_by_row[len(rows)] = pictures

    _finalize_rows(rows)
    return rows, images_by_row


def _fallback_warning(index: int, note: str) -> str:
    return f"Row {index}: {note}; a new product goes into '{FALLBACK_CATEGORY_NAME}' (change it later in admin)"


async def ensure_fallback_category(db: AsyncSession) -> int:
    """Return the id of the 'Uncategorized' category, creating it (hidden from the menu) if needed."""
    result = await db.execute(select(Category).where(Category.slug == FALLBACK_CATEGORY_SLUG))
    category = result.scalar_one_or_none()
    if category is None:
        category = Category(
            name=FALLBACK_CATEGORY_NAME,
            slug=FALLBACK_CATEGORY_SLUG,
            is_active=False,
            sort_order=999,
        )
        db.add(category)
        await db.commit()
        await cache_delete("cats:all")
    return category.id


def build_category_map(categories: list[Category]) -> tuple[dict[str, CategoryRef], list[str]]:
    """lowercased category name -> id, plus the names that collide after lowering."""
    mapping: dict[str, CategoryRef] = {}
    ambiguous: set[str] = set()
    for cat in categories:
        key = cat.name.strip().lower()
        ref = CategoryRef(id=cat.id, name=cat.name, is_active=cat.is_active)
        if key in mapping and mapping[key].id != cat.id:
            ambiguous.add(key)
        else:
            mapping[key] = ref
    return mapping, sorted(ambiguous)


# ---------------------------------------------------------------------------
# Row validation (no writes, no downloads)
# ---------------------------------------------------------------------------


def _check_url_shape(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise RowError(f"'{url}' is not a public http(s) URL or a ZIP filename")
    if not parsed.hostname:
        raise RowError(f"'{url}' has no host")
    if parsed.port not in (None, 80, 443):
        raise RowError(f"'{url}': only ports 80 and 443 are allowed")


def build_row_data(
    row: dict[str, str],
    *,
    cat_map: dict[str, CategoryRef],
    ambiguous: list[str],
    zip_names: set[str] | None,
    embedded: list[bytes] | None = None,
) -> RowData:
    """Validate one CSV row and turn it into a RowData payload. Raises RowError."""
    name = row.get("name", "").strip()
    if not name:
        raise RowError("Missing product name")

    category_raw = row.get("category", "").strip()
    category_key = category_raw.lower()
    category: CategoryRef | None = None
    category_note: str | None = None
    if not category_raw:
        category_note = "No category given"
    elif category_key in ambiguous:
        category_note = f"Category '{category_raw}' is ambiguous (several categories differ only by case)"
    else:
        category = cat_map.get(category_key)
        if category is None:
            category_note = f"Unknown category '{category_raw}'"

    price_raw = row.get("price", "").strip()
    if not price_raw:
        raise RowError("Missing price")
    try:
        price = float(price_raw)
    except ValueError as exc:
        raise RowError(f"Price '{price_raw}' is not a number") from exc
    if price <= 0:
        raise RowError("Price must be greater than 0")

    original_price: float | None = None
    if row.get("original_price", "").strip():
        try:
            original_price = float(row["original_price"])
        except ValueError as exc:
            raise RowError(f"original_price '{row['original_price']}' is not a number") from exc
        if original_price < price:
            raise RowError("original_price must be greater than or equal to price")

    stock_qty: int | None = None
    if row.get("stock_qty", "").strip():
        raw_stock = row["stock_qty"]
        try:
            stock_qty = int(raw_stock)
        except ValueError as exc:
            raise RowError(f"stock_qty '{raw_stock}' is not a whole number") from exc
        if stock_qty < 0:
            raise RowError("stock_qty cannot be negative")

    badge = row.get("badge", "").strip() or None
    if badge and len(badge) > MAX_BADGE_LEN:
        raise RowError(f"badge is longer than {MAX_BADGE_LEN} characters")

    tags_raw = row.get("tags", "").strip()
    tags = [t.strip() for t in tags_raw.split("|") if t.strip()] if tags_raw else None

    image_refs = parse_refs(row.get("image_files", ""))
    if embedded:
        if image_refs:
            raise RowError("Provide images either embedded in PICTURE columns or via image_files, not both")
        if len(embedded) > MAX_IMAGES_PER_ROW:
            raise RowError(f"Too many images ({len(embedded)}); the maximum is {MAX_IMAGES_PER_ROW}")
    else:
        if len(image_refs) > MAX_IMAGES_PER_ROW:
            raise RowError(f"Too many images ({len(image_refs)}); the maximum is {MAX_IMAGES_PER_ROW}")
        for ref in image_refs:
            if urlparse(ref).scheme:
                _check_url_shape(ref)
            elif zip_names is None:
                raise RowError(f"Image '{ref}' is not an image URL and no ZIP was uploaded")
            elif ref.lower() not in zip_names:
                raise RowError(f"Image '{ref}' was not found in the uploaded ZIP")

    return RowData(
        name=name,
        category_id=category.id if category else None,
        price=price,
        original_price=original_price,
        stock_qty=stock_qty,
        description=row.get("description", "").strip() or None,
        badge=badge,
        tags=tags,
        image_refs=image_refs or None,
        embedded=embedded or None,
        category_note=category_note,
    )


async def validate_rows(
    rows: list[dict[str, str]],
    *,
    cat_map: dict[str, CategoryRef],
    ambiguous: list[str],
    zip_names: set[str] | None,
    embedded_by_row: dict[int, list[bytes]] | None = None,
) -> tuple[list[dict], list[str]]:
    """Validate every row without touching the DB or downloading anything.

    Embedded pictures are already in memory, so they are Pillow-checked here too
    (URL/ZIP checks stay structural until the import fetches them).
    """
    results: list[dict] = []
    warnings: list[str] = []
    seen: set[str] = set()
    embedded_by_row = embedded_by_row or {}

    for index, row in enumerate(rows, start=1):
        name = row.get("name", "").strip()
        errors: list[str] = []
        try:
            embedded = embedded_by_row.get(index)
            data = build_row_data(
                row, cat_map=cat_map, ambiguous=ambiguous, zip_names=zip_names, embedded=embedded,
            )
            normalized = data.name.lower()
            if normalized in seen:
                raise RowError(f"Duplicate product name: '{data.name}'")
            seen.add(normalized)
            if embedded:
                await asyncio.gather(
                    *(
                        asyncio.to_thread(_validate_image_bytes, blob, f"{name or 'image'}-{i}")
                        for i, blob in enumerate(embedded, start=1)
                    )
                )
            if data.category_note:
                warnings.append(_fallback_warning(index, data.category_note))
            category = cat_map.get(row.get("category", "").strip().lower())
            if category and not category.is_active:
                warnings.append(f"Row {index}: category '{category.name}' is inactive")
        except RowError as exc:
            errors.append(str(exc))

        results.append({"row": index, "name": name, "status": "error" if errors else "ok", "errors": errors})

    return results, warnings


# ---------------------------------------------------------------------------
# Safe image fetching
# ---------------------------------------------------------------------------


async def _resolve_public(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Only http/https URLs are allowed")
    if not parsed.hostname:
        raise ValueError("URL has no host")
    if parsed.port not in (None, 80, 443):
        raise ValueError("Only ports 80 and 443 are allowed")
    infos = await asyncio.get_running_loop().getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise ValueError(f"Blocked non-public address: {ip}")


async def _fetch_stream(url: str, max_bytes: int = MAX_IMAGE_BYTES) -> bytes:
    """Download a public image, re-validating every redirect hop (max 3)."""
    async with httpx.AsyncClient(timeout=httpx.Timeout(20.0), follow_redirects=False) as client:
        current = url
        for _ in range(MAX_REDIRECTS + 1):
            await _resolve_public(current)
            async with client.stream("GET", current) as response:
                if response.is_redirect:
                    location = response.headers.get("location")
                    if not location:
                        raise ValueError("Redirect without a Location header")
                    current = urljoin(current, location)
                    continue
                response.raise_for_status()
                buffer = bytearray()
                async for chunk in response.aiter_bytes():
                    buffer.extend(chunk)
                    if len(buffer) > max_bytes:
                        raise ValueError("Image exceeds the 5MB limit")
                if not buffer:
                    raise ValueError("Image download was empty")
                return bytes(buffer)
    raise ValueError("Too many redirects while fetching the image")


def _zip_name_map(zf: zipfile.ZipFile) -> dict[str, str]:
    """lowercased basename -> zip entry filename (skips __MACOSX junk)."""
    mapping: dict[str, str] = {}
    for info in zf.infolist():
        if info.is_dir():
            continue
        if "__MACOSX/" in info.filename or Path(info.filename).name.startswith("."):
            continue
        mapping.setdefault(Path(info.filename).name.lower(), info.filename)
    return mapping


def _read_zip_entry(zf: zipfile.ZipFile, ref: str, name_map: dict[str, str]) -> bytes:
    entry = name_map.get(ref.lower())
    if entry is None:
        raise RowError(f"Image '{ref}' was not found in the uploaded ZIP")
    info = zf.getinfo(entry)
    if info.file_size > MAX_IMAGE_BYTES:
        raise RowError(f"Image '{ref}' exceeds the 5MB limit")
    return zf.read(entry)


def _validate_image_bytes(data: bytes, filename: str) -> str:
    """Pillow-validate bytes and return the detected image content type.

    Runs in a thread (see _bytes_for_ref). Required because upload_image_file
    stores unopenable image/* bytes as-is instead of rejecting them.
    """
    try:
        with Image.open(io.BytesIO(data)) as img:
            width, height = img.size
            detected = (img.format or "").upper()
        if width * height > MAX_PIXELS:
            raise RowError(f"Image '{filename}' has too many pixels ({width}x{height})")
        if detected not in ALLOWED_IMAGE_FORMATS:
            raise RowError(f"Image '{filename}' must be a JPG, PNG, or WEBP file")
        if process_image_upload(data) is None:
            raise RowError(f"Image '{filename}' could not be processed")
    except RowError:
        raise
    except Exception as exc:
        raise RowError(f"Image '{filename}' is not a valid image file") from exc
    return _FORMAT_CTYPE[detected]


def _as_upload(data: bytes, filename: str, content_type: str) -> UploadFile:
    return UploadFile(file=io.BytesIO(data), filename=filename, headers=Headers({"content-type": content_type}))


async def _bytes_for_ref(ref: str, zf: zipfile.ZipFile | None, name_map: dict[str, str] | None) -> tuple[bytes, str, str]:
    """Resolve one image reference to validated (data, content_type, filename)."""
    if ref.startswith(("http://", "https://")):
        data = await _fetch_stream(ref)
        filename = Path(urlparse(ref).path).name or "image"
    else:
        if zf is None or name_map is None:
            raise RowError(f"Image '{ref}' was not found in the uploaded ZIP")
        data = _read_zip_entry(zf, ref, name_map)
        filename = Path(ref).name

    content_type = await asyncio.to_thread(_validate_image_bytes, data, filename)
    stem = Path(filename).stem or "image"
    return data, content_type, f"{stem}{_CTYPE_EXT[content_type]}"


async def _fetch_and_validate_images(
    refs: list[str],
    zf: zipfile.ZipFile | None,
    name_map: dict[str, str] | None,
) -> list[tuple[bytes, str, str]]:
    """Download + validate a row's images concurrently. DB-free by design."""
    semaphore = asyncio.Semaphore(IMAGE_CONCURRENCY)

    async def one(ref: str) -> tuple[bytes, str, str]:
        async with semaphore:
            return await _bytes_for_ref(ref, zf, name_map)

    return list(await asyncio.gather(*(one(ref) for ref in refs)))


def _safe_stem(name: str) -> str:
    stem = re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")
    return stem or "product"


async def _validate_embedded(blobs: list[bytes], name: str) -> list[tuple[bytes, str, str]]:
    """Pillow-validate a row's embedded pictures concurrently, in column order."""
    stem = _safe_stem(name)

    async def one(index: int, blob: bytes) -> tuple[bytes, str, str]:
        filename = f"{stem}-{index}"
        content_type = await asyncio.to_thread(_validate_image_bytes, blob, filename)
        return blob, content_type, f"{filename}{_CTYPE_EXT[content_type]}"

    return list(await asyncio.gather(*(one(i, blob) for i, blob in enumerate(blobs, start=1))))


# ---------------------------------------------------------------------------
# Import (one transaction per row)
# ---------------------------------------------------------------------------


def _update_payload(data: RowData) -> ProductUpdate:
    """Blank CSV cells are omitted so existing values stay unchanged."""
    payload: dict = {"name": data.name, "price": data.price}
    if data.category_note is None:
        payload["category_id"] = data.category_id
    if data.original_price is not None:
        payload["original_price"] = data.original_price
    if data.stock_qty is not None:
        payload["stock_qty"] = data.stock_qty
    if data.description is not None:
        payload["description"] = data.description
    if data.badge is not None:
        payload["badge"] = data.badge
    if data.tags is not None:
        payload["tags"] = data.tags
    return ProductUpdate(**payload)


def _create_payload(data: RowData) -> ProductCreate:
    return ProductCreate(
        name=data.name,
        category_id=data.category_id,
        price=data.price,
        original_price=data.original_price,
        stock_qty=data.stock_qty or 0,
        description=data.description,
        badge=data.badge,
        tags=data.tags or [],
    )


async def import_row(
    db: AsyncSession,
    data: RowData,
    zf: zipfile.ZipFile | None,
    name_map: dict[str, str] | None,
) -> tuple[Product, bool]:
    """Upsert one row. Commits or rolls back on its own."""
    try:
        # Step 1: resolve + Pillow-validate images — DB-free, so a bad URL,
        # missing ZIP entry or corrupt/embedded picture fails the row before any
        # database write.
        if data.embedded:
            imgs = await _validate_embedded(data.embedded, data.name)
        elif data.image_refs:
            imgs = await _fetch_and_validate_images(data.image_refs, zf, name_map)
        else:
            imgs = []

        # Step 2: upsert (create/update may roll back internally for slug
        # retries — safe because only this row is uncommitted).
        existing = await product_service.find_by_name_or_slug(db, data.name)
        created = existing is None
        if created:
            product = await product_service.create_product(
                db, _create_payload(data), image_urls=[], skip_cache_invalidation=True,
            )
        else:
            old_slug = existing.slug
            product = await product_service.update_product(
                db, existing, _update_payload(data), skip_cache_invalidation=True,
            )
            if product.slug != old_slug:
                await cache_delete(f"product:{old_slug}")

        # Step 3: upload the validated bytes under the product id, then commit
        # this row. Blank image cell on update keeps the existing images.
        old_keys = list(product.images or []) if not created else []
        new_keys: list[str] = []
        if imgs:
            try:
                for img_data, content_type, filename in imgs:
                    new_keys.append(
                        await upload_image_file(
                            _as_upload(img_data, filename, content_type),
                            folder="products",
                            entity_id=product.id,
                        )
                    )
                product.images = new_keys
                await db.commit()
            except Exception:
                for key in new_keys:
                    await delete_image_file(key)
                raise
        else:
            await db.commit()

        # Step 4: replace-mode cleanup only after the row commit.
        stale = [key for key in old_keys if key not in new_keys]
        for key in stale:
            await delete_image_file(key)

        return product, created
    except Exception:
        await db.rollback()
        raise


def open_zip(data: bytes | None) -> tuple[zipfile.ZipFile | None, dict[str, str] | None]:
    """Open the optional image ZIP with size / entry-count / bomb guards."""
    if not data:
        return None, None
    if len(data) > MAX_ZIP_BYTES:
        raise ValueError("Images ZIP is larger than 60MB")
    try:
        zf = zipfile.ZipFile(io.BytesIO(data))
        infos = zf.infolist()
    except zipfile.BadZipFile as exc:
        raise ValueError("The uploaded file is not a valid ZIP archive") from exc
    if len(infos) > MAX_ZIP_ENTRIES:
        raise ValueError(f"Images ZIP has too many files ({len(infos)}); the maximum is {MAX_ZIP_ENTRIES}")
    total = sum(info.file_size for info in infos)
    if total > MAX_ZIP_UNCOMPRESSED:
        raise ValueError("Images ZIP is too large once uncompressed")
    return zf, _zip_name_map(zf)


async def run_import(
    db: AsyncSession,
    rows: list[dict[str, str]],
    zf: zipfile.ZipFile | None,
    name_map: dict[str, str] | None,
    cat_map: dict[str, CategoryRef],
    ambiguous: list[str],
    embedded_by_row: dict[int, list[bytes]] | None = None,
) -> dict:
    """Import every row with per-row commits; collect row errors instead of failing."""
    created = 0
    updated = 0
    errors: list[dict] = []
    warnings: list[str] = []
    fallback_id: int | None = None
    seen: set[str] = set()
    touched_slugs: list[str] = []
    embedded_by_row = embedded_by_row or {}

    for index, row in enumerate(rows, start=1):
        try:
            data = build_row_data(
                row,
                cat_map=cat_map,
                ambiguous=ambiguous,
                zip_names=name_map,
                embedded=embedded_by_row.get(index),
            )
            normalized = data.name.lower()
            if normalized in seen:
                raise RowError(f"Duplicate product name: '{data.name}'")
            seen.add(normalized)
            if data.category_id is None:
                if fallback_id is None:
                    fallback_id = await ensure_fallback_category(db)
                data.category_id = fallback_id
            product, was_created = await import_row(db, data, zf, name_map)
            if was_created:
                created += 1
            else:
                updated += 1
            if data.category_note and was_created:
                warnings.append(_fallback_warning(index, data.category_note))
            elif data.category_note:
                warnings.append(f"Row {index}: {data.category_note}; existing product kept its current category")
            touched_slugs.append(product.slug)
        except Exception as exc:
            await db.rollback()
            message = str(exc).split("\n")[0] if str(exc) else exc.__class__.__name__
            logger.warning("Bulk import row {} failed: {}", index, message)
            errors.append({"row": index, "name": row.get("name", "").strip(), "error": message})

    # Single cache-invalidation pass for the whole import (per-row invalidation
    # is skipped inside create/update via skip_cache_invalidation=True).
    for slug in touched_slugs:
        await cache_delete(f"product:{slug}")
    if touched_slugs:
        await cache_delete_pattern("products:*")

    return {"created": created, "updated": updated, "errors": errors, "warnings": warnings}


# ---------------------------------------------------------------------------
# XLSX template
# ---------------------------------------------------------------------------


def build_template_xlsx() -> bytes:
    """Build the client-facing template: required columns + embedded-picture slots."""
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter

    wb = Workbook()
    ws = wb.active
    ws.title = "Products"

    ws.append(list(TEMPLATE_HEADERS))
    header_fill = PatternFill("solid", fgColor="046C48")
    header_font = Font(bold=True, color="FFFFFF")
    required = {"name", "category", "price"}
    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
        if str(cell.value).lower() in required:
            cell.value = f"{cell.value} *"

    ws.append([
        "Blue Jhumka", "Earrings", 499, 699, 25, "Cotton-lined jhumka",
        "New Arrival", "gold|festive", "", "", "", "", "",
    ])
    ws.append([
        "Red Bangle", "Bangles", 299, None, 40, "",
        "Bestseller", "red", "", "", "", "", "",
    ])

    widths = {
        "name": 34, "category": 16, "price": 10, "original_price": 14, "stock_qty": 10,
        "description": 44, "badge": 14, "tags": 22,
    }
    for idx, header in enumerate(TEMPLATE_HEADERS, start=1):
        ws.column_dimensions[get_column_letter(idx)].width = widths.get(header.lower(), 20)
    ws.freeze_panes = "A2"

    tips = wb.create_sheet("Instructions")
    for line in TEMPLATE_INSTRUCTIONS:
        tips.append([line])
    tips.column_dimensions["A"].width = 110

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
