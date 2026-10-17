"""Bulk product CSV import.

Implements docs/BULK_IMPORT_PLAN.md (v3):

- CSV rows are upserted by normalized-lowercase name first, slug fallback.
- One transaction per row (savepoints are unusable: product_service calls
  db.rollback() internally on slug collisions, which would discard them).
- Images are fetched + Pillow-validated BEFORE any DB write, so a bad URL or
  corrupt file fails the row before it touches the database.
- Blank cells on update mean "leave unchanged".
- Re-imported images replace the old ones; old files are deleted after commit.
"""

import asyncio
import csv
import io
import ipaddress
import zipfile
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx
from fastapi import UploadFile
from loguru import logger
from PIL import Image
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

REQUIRED_HEADERS = ("name", "category", "price")
OPTIONAL_HEADERS = ("original_price", "stock_qty", "description", "badge", "tags", "image_files")

ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
_FORMAT_CTYPE = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
_CTYPE_EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
_EXT_CTYPE = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}

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
    category_id: int
    price: float
    original_price: float | None = None
    stock_qty: int | None = None
    description: str | None = None
    badge: str | None = None
    tags: list[str] | None = None
    image_refs: list[str] | None = None


# ---------------------------------------------------------------------------
# CSV parsing
# ---------------------------------------------------------------------------


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

    headers = [(h or "").strip().lower() for h in reader.fieldnames]
    missing = [h for h in REQUIRED_HEADERS if h not in headers]
    if missing:
        raise ValueError(f"CSV is missing required column(s): {', '.join(missing)}")

    rows: list[dict[str, str]] = []
    for raw in reader:
        row = {
            str(key).strip().lower(): ("" if value is None else str(value)).strip()
            for key, value in raw.items()
            if key is not None
        }
        if not any(row.values()):
            continue
        rows.append(row)

    if len(rows) > MAX_ROWS:
        raise ValueError(f"CSV has {len(rows)} rows; the maximum is {MAX_ROWS} per import")
    if not rows:
        raise ValueError("CSV contains no data rows")
    return rows


def parse_refs(value: str) -> list[str]:
    return [part.strip() for part in value.split("|") if part.strip()]


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
) -> RowData:
    """Validate one CSV row and turn it into a RowData payload. Raises RowError."""
    name = row.get("name", "").strip()
    if not name:
        raise RowError("Missing product name")

    category_raw = row.get("category", "").strip()
    if not category_raw:
        raise RowError("Missing category")
    category_key = category_raw.lower()
    if category_key in ambiguous:
        raise RowError(f"Category '{category_raw}' is ambiguous (several categories differ only by case)")
    category = cat_map.get(category_key)
    if category is None:
        raise RowError(f"Unknown category '{category_raw}'")

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
        category_id=category.id,
        price=price,
        original_price=original_price,
        stock_qty=stock_qty,
        description=row.get("description", "").strip() or None,
        badge=badge,
        tags=tags,
        image_refs=image_refs or None,
    )


def validate_rows(
    rows: list[dict[str, str]],
    *,
    cat_map: dict[str, CategoryRef],
    ambiguous: list[str],
    zip_names: set[str] | None,
) -> tuple[list[dict], list[str]]:
    """Validate every row without touching the DB or downloading anything."""
    results: list[dict] = []
    warnings: list[str] = []
    seen: set[str] = set()

    for index, row in enumerate(rows, start=1):
        name = row.get("name", "").strip()
        errors: list[str] = []
        try:
            data = build_row_data(row, cat_map=cat_map, ambiguous=ambiguous, zip_names=zip_names)
            normalized = data.name.lower()
            if normalized in seen:
                raise RowError(f"Duplicate product name in this CSV: '{data.name}'")
            seen.add(normalized)
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


# ---------------------------------------------------------------------------
# Import (one transaction per row)
# ---------------------------------------------------------------------------


def _update_payload(data: RowData) -> ProductUpdate:
    """Blank CSV cells are omitted so existing values stay unchanged."""
    payload: dict = {"name": data.name, "category_id": data.category_id, "price": data.price}
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
        # Step 1: fetch + Pillow-validate images — DB-free, so a bad URL or
        # corrupt file fails the row before any database write.
        imgs = await _fetch_and_validate_images(data.image_refs, zf, name_map) if data.image_refs else []

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
) -> dict:
    """Import every row with per-row commits; collect row errors instead of failing."""
    created = 0
    updated = 0
    errors: list[dict] = []
    seen: set[str] = set()
    touched_slugs: list[str] = []

    for index, row in enumerate(rows, start=1):
        try:
            data = build_row_data(row, cat_map=cat_map, ambiguous=ambiguous, zip_names=name_map)
            normalized = data.name.lower()
            if normalized in seen:
                raise RowError(f"Duplicate product name in this CSV: '{data.name}'")
            seen.add(normalized)
            product, was_created = await import_row(db, data, zf, name_map)
            if was_created:
                created += 1
            else:
                updated += 1
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

    return {"created": created, "updated": updated, "errors": errors}
