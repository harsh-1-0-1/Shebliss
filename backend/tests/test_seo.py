import pytest
from httpx import AsyncClient

from tests.conftest import _seed_product_and_category

SEO_URL = "/api/v1/seo"


@pytest.mark.asyncio
async def test_head_for_product_page(client: AsyncClient, admin_token: str):
    await _seed_product_and_category(client, admin_token)

    resp = await client.get(f"{SEO_URL}/head", headers={"X-Seo-Path": "/products/widget-product?ref=ig"})

    assert resp.status_code == 200
    body = resp.text
    assert '<title data-seo="server">Widget Product | Shebliss</title>' in body
    assert 'name="description" content="A lovely widget"' in body
    assert 'property="og:type" content="product"' in body
    assert 'property="og:image" content="https://placehold.co/300"' in body
    assert 'href="http://test/products/widget-product"' in body
    assert '"@type": "Product"' in body
    assert '"price": "299.00"' in body


@pytest.mark.asyncio
async def test_head_for_category_and_query_category(client: AsyncClient, admin_token: str):
    await _seed_product_and_category(client, admin_token)

    by_route = await client.get(f"{SEO_URL}/head", params={"path": "/category/test-products"})
    by_query = await client.get(f"{SEO_URL}/head", params={"path": "/products?category=test-products"})

    assert "Test Products Jewellery | Shebliss" in by_route.text
    assert "Test Products Jewellery | Shebliss" in by_query.text


@pytest.mark.asyncio
async def test_head_unknown_product_falls_back(client: AsyncClient):
    resp = await client.get(f"{SEO_URL}/head", params={"path": "/products/missing"})

    assert resp.status_code == 200
    assert '<title data-seo="server">Shebliss</title>' in resp.text


@pytest.mark.asyncio
async def test_head_escapes_html_and_marks_private_pages_noindex(client: AsyncClient):
    resp = await client.get(f"{SEO_URL}/head", params={"path": '/checkout?x="><script>'})

    assert "<script>" not in resp.text.replace('<script data-seo="server" type="application/ld+json">', "")
    assert 'name="robots" content="noindex, nofollow"' in resp.text


@pytest.mark.asyncio
async def test_sitemap_lists_products_and_categories(client: AsyncClient, admin_token: str):
    await _seed_product_and_category(client, admin_token)

    resp = await client.get(f"{SEO_URL}/sitemap.xml")

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/xml")
    assert "<loc>http://test/products/widget-product</loc>" in resp.text
    assert "<loc>http://test/category/test-products</loc>" in resp.text
    assert "<loc>http://test/</loc>" in resp.text


@pytest.mark.asyncio
async def test_robots_points_to_sitemap(client: AsyncClient):
    resp = await client.get(f"{SEO_URL}/robots.txt")

    assert resp.status_code == 200
    assert "Disallow: /checkout" in resp.text
    assert "Sitemap: http://test/sitemap.xml" in resp.text
