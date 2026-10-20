import re
from pathlib import Path

import pytest
from fastapi import UploadFile
from starlette.datastructures import Headers

from app.core.config import settings
from app.schemas.category import CategoryResponse
from app.schemas.product import ProductResponse
from app.utils import image_upload


def test_generate_image_key_uses_entity_and_unique_uuid():
    first = image_upload.generate_image_key("products", 42, "earring.WEBP")
    second = image_upload.generate_image_key("store/products", 42, "earring.WEBP")

    pattern = r"^store/products/42/[0-9a-f-]{36}\.webp$"
    assert re.match(pattern, first)
    assert re.match(pattern, second)
    assert first != second


def test_generate_image_key_rejects_unsafe_namespaces():
    with pytest.raises(ValueError):
        image_upload.generate_image_key("../outside", 1, "earring.jpg")
    with pytest.raises(ValueError):
        image_upload.generate_image_key("products", "../1", "earring.jpg")


def test_url_resolution_and_extraction_round_trip(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "CDN_BASE_URL", "https://images.example.com/")
    key = "store/products/1/image.jpg"

    url = image_upload.resolve_image_url(key)
    assert url == f"https://images.example.com/{key}"
    assert image_upload.extract_relative_key(url) == key
    assert image_upload.extract_relative_key("/static/" + key) == key
    assert image_upload.resolve_image_url("https://elsewhere.test/image.jpg") == (
        "https://elsewhere.test/image.jpg"
    )


def test_variant_images_are_resolved(monkeypatch):
    """resolve_variants_images should convert relative keys to full URLs."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "CDN_BASE_URL", "https://cdn.test")
    variants = {
        "default_image": "store/default.jpg",
        "image_map": {"green": ["store/green.jpg"]},
        "pot_types": [{"name": "Clay", "image_url": "store/clay.jpg"}],
    }

    resolved = image_upload.resolve_variants_images(variants)
    assert resolved["default_image"] == "https://cdn.test/store/default.jpg"
    assert resolved["image_map"]["green"] == ["https://cdn.test/store/green.jpg"]
    assert resolved["pot_types"][0]["image_url"] == "https://cdn.test/store/clay.jpg"


@pytest.mark.asyncio
async def test_local_upload_and_delete(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(image_upload, "STATIC_ROOT", tmp_path)
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "AWS_ACCESS_KEY_ID", "")
    monkeypatch.setattr(settings, "AWS_SECRET_ACCESS_KEY", "")
    monkeypatch.setattr(settings, "AWS_S3_BUCKET", "")
    upload = UploadFile(filename="earring.png", file=__import__("io").BytesIO(b"image"))

    key = await image_upload.upload_image_file(upload, "products", 9)
    assert (tmp_path / key).read_bytes() == b"image"
    await image_upload.delete_image_file(key)
    assert not (tmp_path / key).exists()


@pytest.mark.asyncio
async def test_production_without_s3_fails(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "AWS_ACCESS_KEY_ID", "")
    monkeypatch.setattr(settings, "AWS_SECRET_ACCESS_KEY", "")
    monkeypatch.setattr(settings, "AWS_S3_BUCKET", "")
    upload = UploadFile(filename="earring.png", file=__import__("io").BytesIO(b"image"))

    with pytest.raises(
        image_upload.ImageStorageUnavailableError,
        match="Missing AWS S3 credentials",
    ):
        await image_upload.upload_image_file(upload, "products", 9)


@pytest.mark.asyncio
async def test_storage_unavailable_handler_returns_safe_503():
    from main import image_storage_unavailable_handler

    response = await image_storage_unavailable_handler(
        None,
        image_upload.ImageStorageUnavailableError(
            "AWS_SECRET_ACCESS_KEY was not configured"
        ),
    )

    assert response.status_code == 503
    assert response.body == b'{"error":"Image upload service unavailable"}'


def test_response_serializers_resolve_keys(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "CDN_BASE_URL", "https://cdn.test")
    product = ProductResponse.model_validate(
        {
            "id": 1,
            "name": "Widget",
            "slug": "widget",
            "description": None,
            "price": 10,
            "original_price": None,
            "stock_qty": 1,
            "category_id": 2,
            "images": ["store/products/1/a.jpg"],
            "tags": [],
            "badge": None,
            "is_active": True,
            "created_at": "2026-01-01T00:00:00Z",
            "variants": None,
        }
    )
    assert product.model_dump()["images"] == [
        "https://cdn.test/store/products/1/a.jpg"
    ]

    category = CategoryResponse.model_validate(
        {"id": 2, "name": "Products", "slug": "products", "parent_id": None,
         "image_url": "store/categories/2/a.jpg", "is_active": True, "sort_order": 0}
    )
    assert category.model_dump()["image_url"].startswith("https://cdn.test/")


def test_url_resolution_follows_cdn_setting_not_environment(monkeypatch):
    key = "store/products/1/image.webp"
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "CDN_BASE_URL", "https://cdn.test")
    assert image_upload.resolve_image_url(key) == f"https://cdn.test/{key}"

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "CDN_BASE_URL", "")
    monkeypatch.setattr(settings, "BACKEND_PUBLIC_URL", "https://api.test")
    assert image_upload.resolve_image_url(key) == f"https://api.test/static/{key}"


@pytest.mark.asyncio
async def test_s3_without_cdn_refuses_upload(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "AWS_ACCESS_KEY_ID", "key")
    monkeypatch.setattr(settings, "AWS_SECRET_ACCESS_KEY", "secret")
    monkeypatch.setattr(settings, "AWS_S3_BUCKET", "bucket")
    monkeypatch.setattr(settings, "CDN_BASE_URL", "")
    upload = UploadFile(filename="earring.png", file=__import__("io").BytesIO(b"image"))

    with pytest.raises(image_upload.ImageStorageUnavailableError, match="CDN_BASE_URL"):
        await image_upload.upload_image_file(upload, "products", 9)


@pytest.mark.asyncio
async def test_s3_upload_used_whenever_credentials_set(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "AWS_ACCESS_KEY_ID", "key")
    monkeypatch.setattr(settings, "AWS_SECRET_ACCESS_KEY", "secret")
    monkeypatch.setattr(settings, "AWS_S3_BUCKET", "bucket")
    monkeypatch.setattr(settings, "CDN_BASE_URL", "https://cdn.test")
    calls = []
    monkeypatch.setattr(image_upload, "_upload_to_s3_sync", lambda *a: calls.append(a))
    upload = UploadFile(filename="clip.mp4", file=__import__("io").BytesIO(b"video"))

    key = await image_upload.upload_image_file(upload, "stories/video", 3)
    assert calls and calls[0][1] == key


@pytest.mark.asyncio
async def test_product_photos_keep_larger_base(tmp_path: Path, monkeypatch):
    from PIL import Image

    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "AWS_ACCESS_KEY_ID", "")
    monkeypatch.setattr(image_upload, "STATIC_ROOT", tmp_path)
    buf = __import__("io").BytesIO()
    Image.new("RGB", (3000, 3000), "white").save(buf, format="PNG")

    def upload():
        return UploadFile(
            filename="big.png",
            file=__import__("io").BytesIO(buf.getvalue()),
            headers=Headers({"content-type": "image/png"}),
        )

    product_key = await image_upload.upload_image_file(upload(), "products", 1)
    banner_key = await image_upload.upload_image_file(upload(), "banners", 1)
    assert Image.open(tmp_path / product_key).width == 2400
    assert Image.open(tmp_path / banner_key).width == 1600
    assert Image.open(tmp_path / image_upload.get_variant_key(product_key, 1200)).width == 1200


@pytest.mark.asyncio
async def test_static_media_is_not_gzipped(tmp_path: Path):
    from httpx import ASGITransport, AsyncClient

    from main import app

    target = Path("static/store/test-gzip")
    target.mkdir(parents=True, exist_ok=True)
    image = target / "big.webp"
    image.write_bytes(b"\0" * 5000)
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            resp = await c.get("/static/store/test-gzip/big.webp", headers={"Accept-Encoding": "gzip"})
        assert resp.status_code == 200
        assert "content-encoding" not in resp.headers
        assert resp.headers["cache-control"] == image_upload.CACHE_CONTROL_IMMUTABLE
    finally:
        image.unlink()
        target.rmdir()
