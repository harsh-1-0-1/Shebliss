#!/usr/bin/env python3
"""
Standalone Cloudflare R2 connectivity test for Shebliss e-commerce store.

This script verifies that your R2 credentials and configuration are working correctly.
It performs upload, list, and delete operations to ensure full functionality.

Usage:
    python test_r2.py

Requires:
    - .env file with R2 credentials in the backend directory
    - boto3 installed (uv run python test_r2.py)
"""

import io
import os
import sys
from pathlib import Path

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
    from dotenv import load_dotenv
except ImportError:
    print("❌ Missing dependencies. Install with: pip install boto3 python-dotenv")
    sys.exit(1)

# Load environment variables
backend_dir = Path(__file__).parent
env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(env_file)
    print(f"✅ Loaded environment from {env_file}\n")
else:
    print(f"⚠️  No .env file found at {env_file}, using system environment variables\n")

# Read R2 configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "auto")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "")
AWS_S3_ENDPOINT_URL = os.getenv("AWS_S3_ENDPOINT_URL", "")
CDN_BASE_URL = os.getenv("CDN_BASE_URL", "")

TEST_PREFIX = "store/_test/"
TEST_KEY = f"{TEST_PREFIX}test-upload-{os.urandom(4).hex()}.png"


def fail(msg: str) -> None:
    print(f"❌ FAILED: {msg}")
    sys.exit(1)


def check_env() -> None:
    """Verify all required environment variables are set."""
    print("=== Step 1: Checking Environment Variables ===")
    missing = []
    
    if not AWS_ACCESS_KEY_ID:
        missing.append("AWS_ACCESS_KEY_ID")
    if not AWS_SECRET_ACCESS_KEY:
        missing.append("AWS_SECRET_ACCESS_KEY")
    if not AWS_S3_BUCKET:
        missing.append("AWS_S3_BUCKET")
    if not AWS_S3_ENDPOINT_URL:
        missing.append("AWS_S3_ENDPOINT_URL")

    if missing:
        fail(f"Missing required environment variables: {', '.join(missing)}")

    print(f"  AWS_REGION           = {AWS_REGION}")
    print(f"  AWS_S3_BUCKET        = {AWS_S3_BUCKET}")
    print(f"  AWS_S3_ENDPOINT_URL  = {AWS_S3_ENDPOINT_URL}")
    print(f"  CDN_BASE_URL         = {CDN_BASE_URL or '(not set - optional)'}")
    print(f"  Access Key ID        = {AWS_ACCESS_KEY_ID[:8]}...{AWS_ACCESS_KEY_ID[-4:]}")
    print("  ✅ All required variables present\n")


def get_r2_client():
    """Create boto3 client configured for Cloudflare R2."""
    return boto3.client(
        "s3",
        endpoint_url=AWS_S3_ENDPOINT_URL,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )


def test_bucket_access(client) -> None:
    """Verify bucket exists and credentials are valid."""
    print("=== Step 2: Testing Bucket Access ===")
    try:
        client.head_bucket(Bucket=AWS_S3_BUCKET)
        print(f"  ✅ Bucket '{AWS_S3_BUCKET}' is accessible\n")
    except NoCredentialsError:
        fail("No credentials found - check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code == "403":
            fail(f"403 Forbidden - IAM permissions issue or wrong bucket name")
        elif code == "404":
            fail(f"404 Not Found - bucket '{AWS_S3_BUCKET}' doesn't exist")
        else:
            fail(f"head_bucket failed: {e}")


def test_upload(client) -> None:
    """Test uploading an object to R2."""
    print("=== Step 3: Testing Upload (PutObject) ===")
    try:
        # Create a small test image (1x1 PNG)
        test_image = io.BytesIO(
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
            b'\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01'
            b'\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        
        client.put_object(
            Bucket=AWS_S3_BUCKET,
            Key=TEST_KEY,
            Body=test_image.getvalue(),
            ContentType="image/png",
        )
        print(f"  ✅ Successfully uploaded test object: {TEST_KEY}\n")
    except ClientError as e:
        fail(f"Upload failed - check IAM has PutObject permission: {e}")


def test_list(client) -> None:
    """Test listing objects in R2."""
    print("=== Step 4: Testing List (ListObjectsV2) ===")
    try:
        response = client.list_objects_v2(Bucket=AWS_S3_BUCKET, Prefix=TEST_PREFIX)
        keys = [obj["Key"] for obj in response.get("Contents", [])]
        
        if TEST_KEY in keys:
            print(f"  ✅ Test object found in bucket listing\n")
        else:
            fail("Test object not found in listing - unexpected issue")
    except ClientError as e:
        fail(f"list_objects_v2 failed - check IAM has ListBucket permission: {e}")


def test_public_access() -> None:
    """Test public CDN access to the uploaded object."""
    print("=== Step 5: Testing Public CDN Access ===")
    
    if not CDN_BASE_URL:
        print("  ⚠️  CDN_BASE_URL not set - skipping public access test")
        print("     Set CDN_BASE_URL to your R2 custom domain to test public access\n")
        return

    cdn_url = f"{CDN_BASE_URL.rstrip('/')}/{TEST_KEY}"
    print(f"  CDN URL: {cdn_url}")
    print("  📋 Open this URL in your browser to verify public access")
    print("     Expected: A 1x1 transparent PNG image should load")
    print("     If you get 404, wait a few minutes for R2 custom domain propagation\n")


def test_cleanup(client) -> None:
    """Delete the test object."""
    print("=== Step 6: Cleaning Up Test Object ===")
    try:
        client.delete_object(Bucket=AWS_S3_BUCKET, Key=TEST_KEY)
        print(f"  ✅ Test object deleted successfully\n")
    except ClientError as e:
        print(f"  ⚠️  Failed to delete test object: {e}")
        print(f"     You may need to manually delete: {TEST_KEY}\n")


def print_summary() -> None:
    """Print final summary and next steps."""
    print("=" * 60)
    print("🎉 R2 Configuration Test Complete!")
    print("=" * 60)
    print("\nYour Cloudflare R2 setup is working correctly!")
    print("\nNext steps:")
    print("  1. Set ENVIRONMENT=production in your .env file")
    print("  2. Restart your backend server")
    print("  3. Test image uploads via the admin dashboard")
    print("  4. Verify images are accessible via your CDN URL")
    print("\nFor production deployment, see: CLOUDFLARE_R2_SETUP.md")
    print()


def main() -> None:
    """Run all R2 connectivity tests."""
    print("\n" + "=" * 60)
    print("Cloudflare R2 Connectivity Test for Shebliss")
    print("=" * 60 + "\n")

    check_env()
    client = get_r2_client()
    
    test_bucket_access(client)
    test_upload(client)
    test_list(client)
    test_public_access()
    
    # Pause before cleanup so user can test the CDN URL
    if CDN_BASE_URL:
        input("Press Enter to delete the test object and finish...")
        print()
    
    test_cleanup(client)
    print_summary()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
