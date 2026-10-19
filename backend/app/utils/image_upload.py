import asyncio
import uuid
from functools import cache
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile
from fastapi.concurrency import run_in_threadpool
from loguru import logger

from app.core.config import settings
from app.utils.image_processing import VARIANT_WIDTHS, process_image_upload

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm"}
STATIC_ROOT = Path("static")

# Aggressive cache for immutable UUID-keyed images. Since keys are unique UUIDs
# that never change (new uploads get new keys), we can cache for a full year.
CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable"


class ImageStorageUnavailableError(RuntimeError):
    """Raised when the configured image storage cannot safely accept uploads."""


def _s3_enabled() -> bool:
    return bool(
        settings.AWS_ACCESS_KEY_ID
        and settings.AWS_SECRET_ACCESS_KEY
        and settings.AWS_S3_BUCKET
    )


@cache
def _get_s3_client():
    """Get S3 client configured for AWS S3 or Cloudflare R2."""
    client_kwargs = {
        "service_name": "s3",
        "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
        "region_name": settings.AWS_REGION or "us-east-1",
    }

    # If AWS_S3_ENDPOINT_URL is set, use it (for Cloudflare R2 or other S3-compatible services)
    if settings.AWS_S3_ENDPOINT_URL:
        client_kwargs["endpoint_url"] = settings.AWS_S3_ENDPOINT_URL
        logger.info("Using custom S3 endpoint: {}", settings.AWS_S3_ENDPOINT_URL)

    return boto3.client(**client_kwargs)


def resolve_image_url(key: str | None) -> str | None:
    if not key:
        return None
    if key.startswith(("http://", "https://", "/")):
        return key

    if settings.CDN_BASE_URL:
        return f"{settings.CDN_BASE_URL.rstrip('/')}/{key.lstrip('/')}"

    return f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}/static/{key.lstrip('/')}"


def get_variant_key(base_key: str, width: int) -> str:
    """Derive a responsive variant storage key from the base key.

    Example: store/products/42/abc.webp -> store/products/42/abc_800w.webp
    Also works for legacy keys: store/products/42/abc.jpg -> store/products/42/abc_800w.webp
    """
    path = Path(base_key)
    stem = str(path.with_suffix(""))  # strip extension
    return f"{stem}_{width}w.webp"


def resolve_image_variant_url(key: str | None, width: int) -> str | None:
    """Resolve a responsive variant URL from a base image key."""
    if not key:
        return None
    return resolve_image_url(get_variant_key(key, width))


def extract_relative_key(url: str | None) -> str | None:
    if not url:
        return None

    # Strip CDN base URL if present
    if settings.CDN_BASE_URL:
        cdn_prefix = settings.CDN_BASE_URL.rstrip('/') + '/'
        if url.startswith(cdn_prefix):
            return url[len(cdn_prefix):]

    # Strip backend public URL + /static/
    static_prefix = f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}/static/"
    if url.startswith(static_prefix):
        return url[len(static_prefix):]

    # Strip local static prefix
    if url.startswith("/static/"):
        return url[len("/static/"):]

    return url


def resolve_variants_images(variants: dict | None) -> dict | None:
    """Resolve relative image keys to full URLs in variant structure.

    Supports both old format (colors, pot_types, image_map) and
    new format (variant_groups with per-option images).
    """
    if not variants:
        return variants

    resolved = dict(variants)

    # Always resolve default_image if present
    if "default_image" in resolved and resolved["default_image"]:
        resolved["default_image"] = resolve_image_url(resolved["default_image"])

    # New format: variant_groups
    if "variant_groups" in resolved and isinstance(resolved["variant_groups"], list):
        resolved_groups = []
        for group in resolved["variant_groups"]:
            resolved_group = dict(group)
            if "options" in resolved_group and isinstance(resolved_group["options"], list):
                resolved_options = []
                for option in resolved_group["options"]:
                    resolved_option = dict(option)
                    # Resolve images array for each option
                    if "images" in resolved_option and isinstance(resolved_option["images"], list):
                        resolved_option["images"] = [
                            resolve_image_url(img) for img in resolved_option["images"]
                        ]
                    resolved_options.append(resolved_option)
                resolved_group["options"] = resolved_options
            resolved_groups.append(resolved_group)
        resolved["variant_groups"] = resolved_groups

    # Old format: image_map, pot_types, colors
    if "image_map" in resolved and isinstance(resolved["image_map"], dict):
        resolved["image_map"] = {
            k: [resolve_image_url(img) for img in v] if isinstance(v, list) else []
            for k, v in resolved["image_map"].items()
        }

    if "pot_types" in resolved and isinstance(resolved["pot_types"], list):
        resolved["pot_types"] = [
            {**pt, "image_url": resolve_image_url(pt.get("image_url"))} if "image_url" in pt else pt
            for pt in resolved["pot_types"]
        ]

    if "colors" in resolved and isinstance(resolved["colors"], list):
        resolved["colors"] = [
            {**c, "image_url": resolve_image_url(c.get("image_url"))} if "image_url" in c else c
            for c in resolved["colors"]
        ]

    return resolved


def generate_image_key(
    folder: str,
    entity_id: str | int | None,
    filename: str,
    ext_override: str | None = None,
) -> str:
    ext = ext_override or (Path(filename).suffix.lower() if filename else ".jpg")
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"

    uuid_str = str(uuid.uuid4())
    clean_folder = folder.removeprefix("store/").strip("/")
    if not clean_folder or any(part in {"", ".", ".."} for part in clean_folder.split("/")):
        raise ValueError("Invalid image folder")

    eid = str(entity_id) if entity_id is not None else uuid_str
    if "/" in eid or "\\" in eid or eid in {".", ".."}:
        raise ValueError("Invalid image entity id")
    return f"store/{clean_folder}/{eid}/{uuid_str}{ext}"


def _upload_to_s3_sync(
    file_bytes: bytes,
    key: str,
    content_type: str,
    cache_control: str | None = None,
) -> None:
    client = _get_s3_client()
    put_kwargs: dict = {
        "Bucket": settings.AWS_S3_BUCKET,
        "Key": key,
        "Body": file_bytes,
        "ContentType": content_type,
    }
    if cache_control:
        put_kwargs["CacheControl"] = cache_control
    client.put_object(**put_kwargs)


def _delete_from_s3_sync(key: str) -> None:
    client = _get_s3_client()
    client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=key)


async def upload_image_file(
    file: UploadFile,
    folder: str,
    entity_id: str | int | None = None,
) -> str:
    is_prod = settings.ENVIRONMENT.lower() == "production"
    s3_enabled = _s3_enabled()
    if is_prod and not s3_enabled:
        raise ImageStorageUnavailableError(
            "Missing AWS S3 credentials in production environment"
        )
    if s3_enabled and not settings.CDN_BASE_URL:
        raise ImageStorageUnavailableError(
            "CDN_BASE_URL must be set when S3/R2 storage is configured"
        )

    contents = await file.read()

    # Determine whether this is an image we can optimize with Pillow.
    # Video files (.mp4, .webm) and anything Pillow can't open are stored as-is.
    is_image = file.content_type is not None and file.content_type.startswith("image/")

    if is_image:
        processed = await run_in_threadpool(process_image_upload, contents)
        if processed is not None:
            key = generate_image_key(folder, entity_id, file.filename or "", ext_override=".webp")
            if s3_enabled:
                objects = [(key, processed.base_bytes)] + [
                    (get_variant_key(key, width), variant_bytes)
                    for width, variant_bytes in processed.variants.items()
                ]
                await asyncio.gather(*(
                    run_in_threadpool(_upload_to_s3_sync, body, obj_key, "image/webp", CACHE_CONTROL_IMMUTABLE)
                    for obj_key, body in objects
                ))
                logger.info("Image uploaded to S3 (WebP + {} variants): {}", len(processed.variants), key)
            else:
                base_path = STATIC_ROOT / key
                base_path.parent.mkdir(parents=True, exist_ok=True)
                await run_in_threadpool(base_path.write_bytes, processed.base_bytes)
                for width, variant_bytes in processed.variants.items():
                    v_key = get_variant_key(key, width)
                    v_path = STATIC_ROOT / v_key
                    await run_in_threadpool(v_path.write_bytes, variant_bytes)
                logger.info("Image saved locally (WebP + {} variants): {}", len(processed.variants), key)
            return key
        # Pillow couldn't open it — fall through to store original bytes as-is.

    # Store as-is (video, or image Pillow couldn't process)
    key = generate_image_key(folder, entity_id, file.filename or "")
    content_type = file.content_type or "application/octet-stream"
    if s3_enabled:
        await run_in_threadpool(_upload_to_s3_sync, contents, key, content_type, CACHE_CONTROL_IMMUTABLE)
        logger.info("File uploaded to S3: {}", key)
        return key
    dest = STATIC_ROOT / key
    dest.parent.mkdir(parents=True, exist_ok=True)
    await run_in_threadpool(dest.write_bytes, contents)
    logger.info("File saved locally: {}", key)
    return key


async def delete_image_file(key: str | None) -> None:
    if not key:
        return

    relative_key = extract_relative_key(key)
    if not relative_key or relative_key.startswith(("http://", "https://", "/")):
        return

    # Keys to delete: the base object plus all responsive variant objects.
    keys_to_delete = [relative_key]
    keys_to_delete.extend(get_variant_key(relative_key, w) for w in VARIANT_WIDTHS)

    if _s3_enabled():
        async def delete_one(del_key: str) -> None:
            try:
                await run_in_threadpool(_delete_from_s3_sync, del_key)
            except ClientError as e:
                # Variant might not exist (legacy image without variants) — ignore.
                logger.debug("S3 delete skipped for {}: {}", del_key, e)

        await asyncio.gather(*(delete_one(del_key) for del_key in keys_to_delete))
        logger.info("Deleted S3 object + variants: {}", relative_key)
    else:
        static_root = STATIC_ROOT.resolve()
        for del_key in keys_to_delete:
            local_path = (STATIC_ROOT / del_key).resolve()
            if static_root not in local_path.parents:
                continue
            if local_path.exists():
                try:
                    await run_in_threadpool(local_path.unlink)
                except Exception as e:
                    logger.error("Failed to delete local file {}: {}", local_path, e)
        logger.info("Deleted local file + variants: {}", relative_key)


async def handle_image_upload(file: UploadFile, folder: str) -> dict:
    """Fallback wrapper for backward compatibility."""
    key = await upload_image_file(file, folder)
    url = resolve_image_url(key)
    return {"url": url, "public_id": key}


async def handle_image_delete(public_id: str | None) -> None:
    """Fallback wrapper for backward compatibility."""
    if public_id:
        await delete_image_file(public_id)
