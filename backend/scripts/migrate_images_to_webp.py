#!/usr/bin/env python3
"""
Migrate existing R2/S3 images to WebP with responsive variants.

This script:
1. Lists all objects in the configured S3/R2 bucket
2. For each JPEG/PNG image:
   a. Downloads the original
   b. Converts to WebP and generates responsive variants (400w, 800w, 1200w)
   c. Uploads with proper Cache-Control headers
   d. Optionally updates the database (requires running as a Django/FastAPI context)

Usage:
    # Dry run (just report what would be migrated)
    python -m scripts.migrate_images_to_webp --dry-run

    # Actual migration (uploads to R2)
    python -m scripts.migrate_images_to_webp

    # With database update (updates image keys in products table)
    python -m scripts.migrate_images_to_webp --update-db

Prerequisites:
    - Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_S3_ENDPOINT_URL
    - For R2: AWS_S3_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com
    - Set ENVIRONMENT=production (or run with AWS credentials directly)
"""

import argparse
import io
import sys
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from PIL import Image, ImageOps
from loguru import logger

from app.core.config import settings
from app.utils.image_upload import (
    CACHE_CONTROL_IMMUTABLE,
    _get_s3_client,
    extract_relative_key,
    get_variant_key,
)
from app.utils.image_processing import VARIANT_WIDTHS, _save_webp, _resize_to_width


# Maximum width for the base (full-size) image
MAX_BASE_WIDTH = 1600


def list_s3_objects(s3_client, bucket: str, prefix: str = "store/") -> list[str]:
    """List all objects in the S3 bucket under the given prefix."""
    objects = []
    continuation_token = None

    while True:
        kwargs = {"Bucket": bucket, "Prefix": prefix}
        if continuation_token:
            kwargs["ContinuationToken"] = continuation_token

        response = s3_client.list_objects_v2(**kwargs)
        if "Contents" not in response:
            break

        for obj in response["Contents"]:
            objects.append(obj["Key"])

        if response.get("IsTruncated"):
            continuation_token = response["NextContinuationToken"]
        else:
            break

    return objects


def is_convertible_image(key: str) -> bool:
    """Check if the key points to a JPEG or PNG that should be converted."""
    key_lower = key.lower()
    return key_lower.endswith((".jpg", ".jpeg", ".png")) and not key_lower.endswith(".webp")


def process_and_upload_object(
    s3_client,
    bucket: str,
    key: str,
    dry_run: bool = True,
) -> dict | None:
    """Download, convert to WebP, generate variants, and upload to S3."""
    try:
        # Download original
        response = s3_client.get_object(Bucket=bucket, Key=key)
        original_bytes = response["Body"].read()

        # Open with Pillow
        img = Image.open(io.BytesIO(original_bytes))

        # Auto-rotate based on EXIF
        img = ImageOps.exif_transpose(img)

        # Normalize color mode
        has_alpha = img.mode in ("RGBA", "LA") or (
            img.mode == "P" and "transparency" in img.info
        )
        img = img.convert("RGBA" if has_alpha else "RGB")

        # Base image (capped at MAX_BASE_WIDTH)
        base_img = _resize_to_width(img, MAX_BASE_WIDTH)
        base_bytes = _save_webp(base_img)

        # Generate variants
        variants: dict[int, bytes] = {}
        for width in VARIANT_WIDTHS:
            variant_img = _resize_to_width(img, width)
            variants[width] = _save_webp(variant_img)

        if dry_run:
            logger.info("[DRY RUN] Would convert {} → {} + {} variants", key, base_img.width, len(variants))
            return None

        # Generate new base key with .webp extension
        # store/products/42/abc.jpg → store/products/42/abc.webp
        new_base_key = str(Path(key).with_suffix(".webp"))

        # Upload base WebP
        s3_client.put_object(
            Bucket=bucket,
            Key=new_base_key,
            Body=base_bytes,
            ContentType="image/webp",
            CacheControl=CACHE_CONTROL_IMMUTABLE,
        )
        logger.info("Uploaded base WebP: {}", new_base_key)

        # Upload variants
        for width, variant_bytes in variants.items():
            v_key = get_variant_key(new_base_key, width)
            s3_client.put_object(
                Bucket=bucket,
                Key=v_key,
                Body=variant_bytes,
                ContentType="image/webp",
                CacheControl=CACHE_CONTROL_IMMUTABLE,
            )
            logger.info("Uploaded variant {}w: {}", width, v_key)

        return {
            "original_key": key,
            "new_base_key": new_base_key,
            "variants": list(variants.keys()),
        }

    except Exception as e:
        logger.error("Failed to process {}: {}", key, e)
        return None


def main():
    parser = argparse.ArgumentParser(description="Migrate existing images to WebP")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="Only report what would be migrated, don't actually upload",
    )
    parser.add_argument(
        "--update-db",
        action="store_true",
        default=False,
        help="Update image keys in the database (requires DB connection)",
    )
    parser.add_argument(
        "--prefix",
        default="store/",
        help="S3 prefix to migrate (default: store/)",
    )
    args = parser.parse_args()

    # Validate settings
    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        logger.error("AWS credentials not configured")
        sys.exit(1)

    if not settings.AWS_S3_BUCKET:
        logger.error("AWS_S3_BUCKET not configured")
        sys.exit(1)

    logger.info("Connecting to S3 bucket: {}", settings.AWS_S3_BUCKET)
    s3_client = _get_s3_client()

    # List all objects
    logger.info("Listing objects with prefix: {}", args.prefix)
    all_objects = list_s3_objects(s3_client, settings.AWS_S3_BUCKET, args.prefix)
    logger.info("Found {} total objects", len(all_objects))

    # Filter to convertible images
    convertible = [obj for obj in all_objects if is_convertible_image(obj)]
    logger.info("Found {} images to convert (JPEG/PNG)", len(convertible))

    if not convertible:
        logger.info("No images to migrate")
        return

    # Process each image
    migrated = []
    errors = []

    for i, key in enumerate(convertible):
        logger.info("[{}/{}] Processing {}", i + 1, len(convertible), key)
        result = process_and_upload_object(
            s3_client,
            settings.AWS_S3_BUCKET,
            key,
            dry_run=args.dry_run,
        )
        if result:
            migrated.append(result)
        else:
            errors.append(key)

    # Summary
    logger.info("=" * 60)
    logger.info("Migration complete!")
    logger.info("Converted: {}", len(migrated))
    logger.info("Errors: {}", len(errors))
    logger.info("=" * 60)

    if errors:
        logger.warning("Failed to migrate: {}", errors)

    if args.dry_run:
        logger.info("This was a dry run. Run without --dry-run to actually migrate.")

    if args.update_db and migrated:
        logger.warning("Database update not implemented - requires custom SQL/ORM work")
        logger.info("Migrated keys: {}", [m["new_base_key"] for m in migrated])


if __name__ == "__main__":
    main()