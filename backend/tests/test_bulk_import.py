import io
import zipfile

import pytest
from httpx import AsyncClient

from tests.conftest import _seed_category

VALIDATE_URL = "/api/v1/products/bulk-import/validate"
IMPORT_URL = "/api/v1/products/bulk-import"
TEMPLATE_URL = "/api/v1/products/bulk-import/template"

HEADERS = "name,category,price,original_price,stock_qty,description,badge,tags,image_files"


def _csv(body: str) -> bytes:
    return f"{HEADERS}\n{body}".encode()


def _files(csv_bytes: bytes, zip_bytes: bytes | None = None) -> dict:
    files = {"csv_file": ("products.csv", csv_bytes, "text/csv")}
    if zip_bytes is not None:
        files["images_zip"] = ("images.zip", zip_bytes, "application/zip")
    return files


async def _post(client: AsyncClient, token: str, url: str, csv_bytes: bytes, zip_bytes: bytes | None = None):
    return await client.post(
        url,
        files=_files(csv_bytes, zip_bytes),
        headers={"Authorization": f"Bearer {token}"},
    )


def _png_bytes() -> bytes:
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (8, 8), (255, 0, 0)).save(buf, format="PNG")
    return buf.getvalue()


def _zip_with(entries: dict[str, bytes]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for name, data in entries.items():
            zf.writestr(name, data)
    return buf.getvalue()


def _xlsx_bytes(
    rows: list[list], images: list[tuple[str, bytes]] | None = None, headers: list[str] | None = None,
) -> bytes:
    from openpyxl import Workbook
    from openpyxl.drawing.image import Image as XLImage

    from app.services.bulk_import_service import TEMPLATE_HEADERS

    wb = Workbook()
    ws = wb.active
    ws.title = "Products"
    ws.append(list(headers if headers is not None else TEMPLATE_HEADERS))
    for row in rows:
        ws.append(row)
    for cell, blob in images or []:
        ws.add_image(XLImage(io.BytesIO(blob)), cell)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def _corrupt_first_media(xlsx_bytes: bytes) -> bytes:
    src = zipfile.ZipFile(io.BytesIO(xlsx_bytes))
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as out:
        for info in src.infolist():
            data = b"definitely not an image" if info.filename.startswith("xl/media/") else src.read(info.filename)
            out.writestr(info, data)
    return buf.getvalue()


async def _post_xlsx(client: AsyncClient, token: str, url: str, xlsx_bytes: bytes):
    files = {"csv_file": ("products.xlsx", xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    return await client.post(url, files=files, headers={"Authorization": f"Bearer {token}"})


# ---- Access control & template ------------------------------------------


@pytest.mark.asyncio
async def test_bulk_import_requires_admin(client: AsyncClient):
    resp = await client.post(VALIDATE_URL, files=_files(_csv("A,Earrings,100")))
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_template_download_is_xlsx_with_picture_columns(client: AsyncClient, admin_token: str):
    from app.services import bulk_import_service

    resp = await client.get(TEMPLATE_URL, headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith(bulk_import_service.TEMPLATE_XLSX_MEDIA_TYPE)
    rows, images = bulk_import_service.parse_xlsx(resp.content)
    assert images == {}
    assert set(bulk_import_service.REQUIRED_HEADERS) <= set(rows[0])
    assert "picture 1" in rows[0] and "picture 5" in rows[0]


@pytest.mark.asyncio
async def test_template_csv_variant(client: AsyncClient, admin_token: str):
    resp = await client.get(f"{TEMPLATE_URL}?format=csv", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert resp.text.splitlines()[0] == HEADERS


# ---- Validation ----------------------------------------------------------


@pytest.mark.asyncio
async def test_validate_reports_row_errors(client: AsyncClient, admin_token: str):
    await _seed_category(client, admin_token, "Earrings")
    csv_bytes = _csv(
        "Blue Jhumka,Earrings,499,699,25,desc,New,gold,\n"
        "No Category Item,,100,,,,,,\n"
        "Bad Price,Earrings,abc,,,,,,\n"
        "Negative Price,Earrings,-5,,,,,,\n"
        "Short Original,Earrings,500,400,,,,,\n"
        "Negative Stock,Earrings,100,,-3,,,,\n"
        "Unknown Cat,Earrings,,100,,,,,\n"
        "Blue Jhumka,Earrings,499,,,,,,\n"
    )
    resp = await _post(client, admin_token, VALIDATE_URL, csv_bytes)
    assert resp.status_code == 200, resp.text
    rows = resp.json()["rows"]
    assert [r["status"] for r in rows] == ["ok", "ok", "error", "error", "error", "error", "error", "error"]
    assert rows[6]["errors"][0].startswith("Missing price")
    assert "Duplicate product name" in rows[7]["errors"][0]


@pytest.mark.asyncio
async def test_validate_missing_required_header(client: AsyncClient, admin_token: str):
    resp = await _post(client, admin_token, VALIDATE_URL, b"name,price\nFoo,100\n")
    assert resp.status_code == 400
    assert "category" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_validate_handles_semicolon_delimiter(client: AsyncClient, admin_token: str):
    await _seed_category(client, admin_token, "Earrings")
    csv_bytes = b"name;category;price\nSemi Jhumka;Earrings;499\n"
    resp = await _post(client, admin_token, VALIDATE_URL, csv_bytes)
    assert resp.status_code == 200, resp.text
    assert resp.json()["rows"][0]["status"] == "ok"


@pytest.mark.asyncio
async def test_validate_warns_and_falls_back_for_unknown_and_ambiguous_categories(
    client: AsyncClient, admin_token: str,
):
    await _seed_category(client, admin_token, "Earrings")
    # A case-only name collision with a different slug (possible for legacy rows).
    from app.db.models import Category
    from tests.conftest import test_session_factory

    async with test_session_factory() as db:
        db.add(Category(name="earrings", slug="earrings-legacy"))
        await db.commit()

    csv_bytes = _csv("Item,NoSuchCat,100,,,,,,\nItem2,Earrings,100,,,,,,\nItem3,,100,,,,,,\n")
    resp = await _post(client, admin_token, VALIDATE_URL, csv_bytes)
    body = resp.json()
    assert [r["status"] for r in body["rows"]] == ["ok", "ok", "ok"]
    warnings = " ".join(body["warnings"])
    assert "Unknown category 'NoSuchCat'" in warnings
    assert "ambiguous" in warnings
    assert "No category given" in warnings
    assert "Uncategorized" in warnings


@pytest.mark.asyncio
async def test_import_puts_unknown_category_in_uncategorized(client: AsyncClient, admin_token: str):
    cat = await _seed_category(client, admin_token, "Earrings")
    csv_bytes = _csv("Lost Item,NoSuchCat,100,,,,,,\nBlank Cat,,120,,,,,,\nKnown,Earrings,90,,,,,,\n")
    resp = await _post(client, admin_token, IMPORT_URL, csv_bytes)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["created"] == 3
    assert body["errors"] == []
    assert len(body["warnings"]) == 2

    from sqlalchemy import select

    from app.db.models import Category, Product
    from tests.conftest import test_session_factory

    async with test_session_factory() as db:
        fallback = (
            await db.execute(select(Category).where(Category.slug == "uncategorized"))
        ).scalar_one()
        assert fallback.is_active is False
        products = {p.name: p for p in (await db.execute(select(Product))).scalars()}
    assert products["Lost Item"].category_id == fallback.id
    assert products["Blank Cat"].category_id == fallback.id
    assert products["Known"].category_id == cat["id"]

    # Re-importing with a bad category keeps an existing product's category.
    resp = await _post(client, admin_token, IMPORT_URL, _csv("Known,NoSuchCat,95,,,,,,\n"))
    assert resp.json()["updated"] == 1
    async with test_session_factory() as db:
        known = (await db.execute(select(Product).where(Product.name == "Known"))).scalar_one()
    assert known.category_id == cat["id"]
    assert known.price == 95


@pytest.mark.asyncio
async def test_validate_checks_image_refs_without_downloading(client: AsyncClient, admin_token: str):
    await _seed_category(client, admin_token, "Earrings")
    zip_bytes = _zip_with({"images/real.png": _png_bytes()})

    csv_bytes = _csv(
        "Item With Zip Image,Earrings,100,,,,,,real.png\n"
        "Item Missing From Zip,Earrings,100,,,,,,nope.jpg\n"
        "Item Bad Url,Earrings,100,,,,,,ftp://example.com/a.jpg\n"
        "Item No Zip,Earrings,100,,,,,,lonely.jpg\n"
    )
    resp = await _post(client, admin_token, VALIDATE_URL, csv_bytes, zip_bytes)
    rows = resp.json()["rows"]
    assert rows[0]["status"] == "ok"
    assert "not found in the uploaded ZIP" in rows[1]["errors"][0]
    assert "http(s) URL" in rows[2]["errors"][0]

    resp_no_zip = await _post(client, admin_token, VALIDATE_URL, csv_bytes)
    assert resp_no_zip.json()["rows"][3]["errors"][0].endswith("no ZIP was uploaded")


@pytest.mark.asyncio
async def test_validate_rejects_broken_zip(client: AsyncClient, admin_token: str):
    resp = await _post(client, admin_token, VALIDATE_URL, _csv("A,Earrings,100,,,,,,"), b"not-a-zip")
    assert resp.status_code == 400
    assert "ZIP" in resp.json()["detail"]


# ---- Import --------------------------------------------------------------


@pytest.mark.asyncio
async def test_import_creates_then_updates_with_blank_cell_semantics(
    client: AsyncClient, admin_token: str,
):
    await _seed_category(client, admin_token, "Earrings")

    first = _csv("Blue Jhumka,Earrings,499,699,25,Cotton jhumka,New Arrival,gold|festive,\n")
    resp = await _post(client, admin_token, IMPORT_URL, first)
    assert resp.status_code == 200, resp.text
    assert resp.json() == {"created": 1, "updated": 0, "errors": [], "warnings": []}

    listing = await client.get("/api/v1/products")
    product = listing.json()["items"][0]

    # Blank description / original_price / stock_qty / badge / tags = unchanged.
    second = _csv("Blue Jhumka,Earrings,549,,,,,,,\n")
    resp = await _post(client, admin_token, IMPORT_URL, second)
    assert resp.status_code == 200, resp.text
    assert resp.json() == {"created": 0, "updated": 1, "errors": [], "warnings": []}

    detail = await client.get(f"/api/v1/products/{product['slug']}")
    data = detail.json()
    assert data["price"] == 549
    assert data["original_price"] == 699
    assert data["stock_qty"] == 25
    assert data["description"] == "Cotton jhumka"
    assert data["badge"] == "New Arrival"
    assert data["tags"] == ["gold", "festive"]


@pytest.mark.asyncio
async def test_import_matches_existing_product_by_name(client: AsyncClient, admin_token: str):
    cat = await _seed_category(client, admin_token, "Earrings")
    from app.db.models import Product
    from tests.conftest import test_session_factory

    async with test_session_factory() as db:
        db.add(Product(
            name="Legacy Jhumka!", slug="legacy-jhumka", price=100.0, stock_qty=5,
            category_id=cat["id"], images=[], is_active=True,
        ))
        await db.commit()

    # Normalized name differs from the stored one, but the slug matches.
    resp = await _post(client, admin_token, IMPORT_URL, _csv("Legacy Jhumka,Earrings,150,,,,,,,\n"))
    assert resp.status_code == 200, resp.text
    assert resp.json() == {"created": 0, "updated": 1, "errors": [], "warnings": []}

    listing = await client.get("/api/v1/products")
    assert listing.json()["total"] == 1


@pytest.mark.asyncio
async def test_import_row_failure_leaves_earlier_rows_committed(
    client: AsyncClient, admin_token: str, monkeypatch,
):
    await _seed_category(client, admin_token, "Earrings")

    from app.services import product_service

    original_create = product_service.create_product

    async def flaky_create(db, payload, image_urls=None, *, skip_cache_invalidation=False):
        if payload.name == "Beta Earring":
            raise RuntimeError("simulated mid-import failure")
        return await original_create(
            db, payload, image_urls=image_urls, skip_cache_invalidation=skip_cache_invalidation,
        )

    monkeypatch.setattr("app.services.product_service.create_product", flaky_create)

    csv_bytes = _csv("Alpha Earring,Earrings,100,,,,,,\nBeta Earring,Earrings,200,,,,,,\n")
    resp = await _post(client, admin_token, IMPORT_URL, csv_bytes)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["created"] == 1
    assert len(body["errors"]) == 1
    assert body["errors"][0]["row"] == 2
    assert "simulated mid-import failure" in body["errors"][0]["error"]

    listing = await client.get("/api/v1/products")
    assert listing.json()["total"] == 1
    assert listing.json()["items"][0]["name"] == "Alpha Earring"


@pytest.mark.asyncio
async def test_import_with_zip_rehosts_images(client: AsyncClient, admin_token: str, monkeypatch):
    await _seed_category(client, admin_token, "Earrings")
    zip_bytes = _zip_with({"images/BlueFront.png": _png_bytes()})
    uploaded: list[tuple[str, str | int | None]] = []

    async def fake_upload(file, folder: str, entity_id=None):
        uploaded.append((file.filename, entity_id))
        assert folder == "products"
        return f"store/products/{entity_id}/bluefront.png"

    monkeypatch.setattr("app.services.bulk_import_service.upload_image_file", fake_upload)

    csv_bytes = _csv("Zip Jhumka,Earrings,100,,,,,,bluefront.png\n")
    resp = await _post(client, admin_token, IMPORT_URL, csv_bytes, zip_bytes)
    assert resp.status_code == 200, resp.text
    assert resp.json() == {"created": 1, "updated": 0, "errors": [], "warnings": []}
    assert uploaded == [("bluefront.png", 1)]

    listing = await client.get("/api/v1/products")
    assert listing.json()["items"][0]["images"] == ["http://localhost:8000/static/store/products/1/bluefront.png"]


@pytest.mark.asyncio
async def test_import_bad_image_fails_row_before_any_db_write(
    client: AsyncClient, admin_token: str, monkeypatch,
):
    await _seed_category(client, admin_token, "Earrings")
    zip_bytes = _zip_with({"broken.png": b"definitely not a png"})
    uploads: list[str] = []

    async def fake_upload(file, folder: str, entity_id=None):
        uploads.append(file.filename or "")
        return f"store/products/{entity_id}/x.png"

    monkeypatch.setattr("app.services.bulk_import_service.upload_image_file", fake_upload)

    csv_bytes = _csv("Corrupt Jhumka,Earrings,100,,,,,,broken.png\n")
    resp = await _post(client, admin_token, IMPORT_URL, csv_bytes, zip_bytes)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["created"] == 0
    assert len(body["errors"]) == 1
    assert "not a valid image file" in body["errors"][0]["error"]
    assert uploads == []

    listing = await client.get("/api/v1/products")
    assert listing.json()["total"] == 0


@pytest.mark.asyncio
async def test_import_too_many_rows_rejected(client: AsyncClient, admin_token: str):
    await _seed_category(client, admin_token, "Earrings")
    rows = "".join(f"Item {i},Earrings,100,,,,,,\n" for i in range(51))
    resp = await _post(client, admin_token, IMPORT_URL, _csv(rows))
    assert resp.status_code == 400
    assert "maximum is 50" in resp.json()["detail"]


# ---- XLSX with embedded images -------------------------------------------


@pytest.mark.asyncio
async def test_xlsx_validate_accepts_required_columns_and_pictures(client: AsyncClient, admin_token: str):
    await _seed_category(client, admin_token, "Earrings")
    xlsx = _xlsx_bytes(
        [["Xlsx Jhumka", "Earrings", 150, None, 3, "desc", "New", "gold|festive", "", "", "", "", ""]],
        images=[("I2", _png_bytes())],
    )
    resp = await _post_xlsx(client, admin_token, VALIDATE_URL, xlsx)
    assert resp.status_code == 200, resp.text
    assert resp.json()["rows"][0]["status"] == "ok"


@pytest.mark.asyncio
async def test_xlsx_import_rehosts_embedded_images(client: AsyncClient, admin_token: str, monkeypatch):
    await _seed_category(client, admin_token, "Earrings")
    uploaded: list[str] = []

    async def fake_upload(file, folder: str, entity_id=None):
        uploaded.append(file.filename or "")
        return f"store/products/{entity_id}/{file.filename}"

    monkeypatch.setattr("app.services.bulk_import_service.upload_image_file", fake_upload)

    xlsx = _xlsx_bytes(
        [["Xlsx Jhumka", "Earrings", 150, None, 3, "", "", "", "", "", "", "", ""]],
        images=[("I2", _png_bytes()), ("J2", _png_bytes())],
    )
    resp = await _post_xlsx(client, admin_token, IMPORT_URL, xlsx)
    assert resp.status_code == 200, resp.text
    assert resp.json() == {"created": 1, "updated": 0, "errors": [], "warnings": []}
    assert uploaded == ["xlsx-jhumka-1.png", "xlsx-jhumka-2.png"]

    listing = await client.get("/api/v1/products")
    assert len(listing.json()["items"][0]["images"]) == 2


@pytest.mark.asyncio
async def test_xlsx_missing_required_column_rejected(client: AsyncClient, admin_token: str):
    xlsx = _xlsx_bytes([["Foo", 100]], headers=["name", "price"])
    resp = await _post_xlsx(client, admin_token, VALIDATE_URL, xlsx)
    assert resp.status_code == 400
    assert "category" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_xlsx_corrupt_embedded_picture_fails_row(client: AsyncClient, admin_token: str):
    await _seed_category(client, admin_token, "Earrings")
    xlsx = _corrupt_first_media(_xlsx_bytes(
        [["Broken Jhumka", "Earrings", 100, None, 1, "", "", "", "", "", "", "", ""]],
        images=[("I2", _png_bytes())],
    ))
    resp = await _post_xlsx(client, admin_token, VALIDATE_URL, xlsx)
    assert resp.status_code == 200, resp.text
    row = resp.json()["rows"][0]
    assert row["status"] == "error"
    assert "not a valid image file" in row["errors"][0]


@pytest.mark.asyncio
async def test_xlsx_too_many_embedded_pictures_rejected(client: AsyncClient, admin_token: str):
    await _seed_category(client, admin_token, "Earrings")
    from app.services.bulk_import_service import TEMPLATE_HEADERS

    headers = [*TEMPLATE_HEADERS, "PICTURE 6"]
    row = ["Nine Jhumka", "Earrings", 100, None, 1, "", "", "", "", "", "", "", "", ""]
    images = [(f"{chr(ord('I') + i)}2", _png_bytes()) for i in range(6)]
    xlsx = _xlsx_bytes([row], images=images, headers=headers)
    resp = await _post_xlsx(client, admin_token, VALIDATE_URL, xlsx)
    assert resp.status_code == 200, resp.text
    row_result = resp.json()["rows"][0]
    assert row_result["status"] == "error"
    assert "Too many images" in row_result["errors"][0]
