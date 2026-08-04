# Image storage

Database records store portable relative object keys, not deployment-specific
URLs. API response serializers resolve those keys using `CDN_BASE_URL`, or
`BACKEND_PUBLIC_URL/static/` when no CDN is configured.

Uploaded objects use this collision-resistant convention:

```text
store/{folder}/{entityId}/{uuid}.{ext}
```

Examples include `store/products/42/...webp`,
`store/product-variants/42/...jpg`, `store/categories/7/...png`,
`store/banners/shared/...webp`, and `store/blog/12/...jpg`.

Production requires `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and
`AWS_S3_BUCKET`. `AWS_REGION` defaults to `us-east-1`. Missing S3 configuration
in production is a hard error. Development and test environments fall back to
the local `static/` directory.

Use only the `store/_test/` namespace for manual storage experiments, and
remove test objects afterward.
