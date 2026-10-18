#!/usr/bin/env python3
"""
Copy locally stored images and videos (backend/static/store/) into the S3/R2 bucket.

Run this once before setting CDN_BASE_URL in production: the database keeps
relative keys (store/products/42/abc.webp), so after the copy every existing
image resolves to the CDN with no database changes.

Usage (from backend/, with the R2 variables set in the environment or .env):
    uv run python -m scripts.upload_static_to_r2 --dry-run
    uv run python -m scripts.upload_static_to_r2
    uv run python -m scripts.upload_static_to_r2 --static-dir /app/static --force
"""

import argparse
import mimetypes
import sys
from pathlib import Path

from botocore.exceptions import ClientError

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings  # noqa: E402
from app.utils.image_upload import (  # noqa: E402
    ALLOWED_EXTENSIONS,
    CACHE_CONTROL_IMMUTABLE,
    _get_s3_client,
    _s3_enabled,
)


def _exists(client, key: str) -> bool:
    try:
        client.head_object(Bucket=settings.AWS_S3_BUCKET, Key=key)
        return True
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") in {"404", "NoSuchKey", "NotFound"}:
            return False
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--static-dir", default="static", help="Local static root (default: static)")
    parser.add_argument("--dry-run", action="store_true", help="List what would be uploaded")
    parser.add_argument("--force", action="store_true", help="Re-upload objects that already exist")
    args = parser.parse_args()

    if not _s3_enabled():
        print("AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_S3_BUCKET must be set.")
        return 1

    root = Path(args.static_dir).resolve()
    store = root / "store"
    if not store.is_dir():
        print(f"Nothing to upload: {store} does not exist.")
        return 0

    files = sorted(p for p in store.rglob("*") if p.is_file() and p.suffix.lower() in ALLOWED_EXTENSIONS)
    client = _get_s3_client()
    uploaded = skipped = failed = 0

    for path in files:
        key = path.relative_to(root).as_posix()
        if not args.force and _exists(client, key):
            skipped += 1
            continue
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        if args.dry_run:
            print(f"would upload {key} ({content_type})")
            uploaded += 1
            continue
        try:
            client.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=key,
                Body=path.read_bytes(),
                ContentType=content_type,
                CacheControl=CACHE_CONTROL_IMMUTABLE,
            )
            uploaded += 1
            print(f"uploaded {key}")
        except ClientError as exc:
            failed += 1
            print(f"FAILED {key}: {exc}")

    verb = "would upload" if args.dry_run else "uploaded"
    print(f"\n{len(files)} files: {verb} {uploaded}, already in bucket {skipped}, failed {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
