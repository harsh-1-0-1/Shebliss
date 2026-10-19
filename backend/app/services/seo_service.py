import json
import re
from dataclasses import dataclass, field
from html import escape
from urllib.parse import parse_qs, urlsplit

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import BlogPost, Category, Product
from app.utils.image_upload import resolve_image_url

DEFAULT_DESCRIPTION = (
    "Shop handcrafted artificial jewellery online: kundan, temple, bridal sets, "
    "earrings, bangles and more. 18k gold plated, anti-tarnish, COD available."
)

STATIC_PAGES: dict[str, tuple[str, str]] = {
    "/products": ("All Jewellery", "Browse the full Shebliss collection of artificial jewellery."),
    "/shop-by-color": ("Shop by Color", "Find jewellery that matches your outfit, sorted by colour."),
    "/blog": ("Journal", "Styling tips, jewellery guides and stories from Shebliss."),
    "/corporate-gifting": ("Corporate Gifting", "Jewellery gift boxes for teams, clients and events."),
    "/faqs": ("FAQs", "Answers about orders, shipping, returns and jewellery care."),
    "/damage-replacement": ("Damage Replacement", "Request a replacement for an item that arrived damaged."),
}

NOINDEX_PREFIXES = ("/cart", "/checkout", "/orders", "/wishlist", "/damage-claims", "/admin")


@dataclass
class PageMeta:
    title: str
    description: str = DEFAULT_DESCRIPTION
    url: str = ""
    image: str | None = None
    og_type: str = "website"
    noindex: bool = False
    json_ld: list[dict] = field(default_factory=list)


def site_url(request_base: str) -> str:
    return (settings.SITE_URL or request_base).rstrip("/")


def _plain(text: str | None, limit: int = 160) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"<[^>]+>|[#*_`>\[\]]", " ", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[: limit - 1].rsplit(" ", 1)[0] + "…"


def _absolute(url: str | None, base: str) -> str | None:
    if not url:
        return None
    if url.startswith(("http://", "https://")):
        return url
    return f"{base}/{url.lstrip('/')}"


def _full_title(title: str) -> str:
    name = settings.APP_NAME
    return title if title == name or title.endswith(f"| {name}") else f"{title} | {name}"


def _titleize(slug: str) -> str:
    return slug.replace("-", " ").title()


async def _product_meta(db: AsyncSession, slug: str, base: str) -> PageMeta | None:
    result = await db.execute(
        select(Product).where(Product.slug == slug, Product.is_active == True)  # noqa: E712
    )
    product = result.scalar_one_or_none()
    if product is None:
        return None
    images = [_absolute(resolve_image_url(k), base) for k in (product.images or [])]
    images = [i for i in images if i]
    url = f"{base}/products/{product.slug}"
    description = _plain(product.description) or f"Buy {product.name} online at {settings.APP_NAME}."
    offer = {
        "@type": "Offer",
        "price": f"{product.price:.2f}",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock" if product.stock_qty > 0 else "https://schema.org/OutOfStock",
        "url": url,
    }
    product_ld = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": description,
        "sku": str(product.id),
        "brand": {"@type": "Brand", "name": settings.APP_NAME},
        "offers": offer,
    }
    if images:
        product_ld["image"] = images
    return PageMeta(
        title=product.name,
        description=description,
        url=url,
        image=images[0] if images else None,
        og_type="product",
        json_ld=[product_ld],
    )


async def _category_meta(db: AsyncSession, slug: str, base: str) -> PageMeta | None:
    result = await db.execute(
        select(Category).where(Category.slug == slug, Category.is_active == True)  # noqa: E712
    )
    category = result.scalar_one_or_none()
    if category is None:
        return None
    name = category.name.title() if category.name.isupper() else category.name
    return PageMeta(
        title=f"{name} Jewellery",
        description=f"Shop {name.lower()} artificial jewellery online at {settings.APP_NAME}. {DEFAULT_DESCRIPTION}",
        url=f"{base}/category/{category.slug}",
        image=_absolute(resolve_image_url(category.image_url), base),
    )


async def _blog_meta(db: AsyncSession, slug: str, base: str) -> PageMeta | None:
    result = await db.execute(
        select(BlogPost).where(BlogPost.slug == slug, BlogPost.is_published == True)  # noqa: E712
    )
    post = result.scalar_one_or_none()
    if post is None:
        return None
    return PageMeta(
        title=post.title,
        description=_plain(post.excerpt),
        url=f"{base}/blog/{post.slug}",
        image=_absolute(resolve_image_url(post.cover_image_url), base),
        og_type="article",
    )


async def build_page_meta(db: AsyncSession, raw_path: str, request_base: str) -> PageMeta:
    base = site_url(request_base)
    parts = urlsplit(raw_path or "/")
    path = "/" + parts.path.strip("/")
    query = parse_qs(parts.query)
    segments = [s for s in path.split("/") if s]

    meta: PageMeta | None = None
    if len(segments) == 2 and segments[0] == "products":
        meta = await _product_meta(db, segments[1], base)
    elif len(segments) == 2 and segments[0] == "category":
        meta = await _category_meta(db, segments[1], base)
    elif len(segments) == 2 and segments[0] == "blog":
        meta = await _blog_meta(db, segments[1], base)
    elif len(segments) == 2 and segments[0] == "colour":
        name = _titleize(segments[1])
        meta = PageMeta(title=f"{name} Jewellery", url=f"{base}{path}")
    elif path == "/products" and query.get("category"):
        meta = await _category_meta(db, query["category"][0], base)
    elif path in STATIC_PAGES:
        title, description = STATIC_PAGES[path]
        meta = PageMeta(title=title, description=description, url=f"{base}{path}")
    elif path == "/":
        meta = PageMeta(
            title="Artificial Jewellery Online",
            url=f"{base}/",
            json_ld=[
                {
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "name": settings.APP_NAME,
                    "url": f"{base}/",
                }
            ],
        )

    if meta is None:
        meta = PageMeta(title=settings.APP_NAME, url=f"{base}{path}")
    if path.startswith(NOINDEX_PREFIXES):
        meta.noindex = True
    if not meta.image:
        meta.image = f"{base}/favicon.png"
    return meta


def render_head(meta: PageMeta) -> str:
    title = escape(_full_title(meta.title))
    description = escape(meta.description)
    tags = [
        f'<title data-seo="server">{title}</title>',
        f'<meta data-seo="server" name="description" content="{description}" />',
        f'<link data-seo="server" rel="canonical" href="{escape(meta.url)}" />',
        f'<meta data-seo="server" property="og:site_name" content="{escape(settings.APP_NAME)}" />',
        f'<meta data-seo="server" property="og:type" content="{meta.og_type}" />',
        f'<meta data-seo="server" property="og:title" content="{title}" />',
        f'<meta data-seo="server" property="og:description" content="{description}" />',
        f'<meta data-seo="server" property="og:url" content="{escape(meta.url)}" />',
        '<meta data-seo="server" name="twitter:card" content="summary_large_image" />',
        f'<meta data-seo="server" name="twitter:title" content="{title}" />',
        f'<meta data-seo="server" name="twitter:description" content="{description}" />',
    ]
    if meta.image:
        tags.append(f'<meta data-seo="server" property="og:image" content="{escape(meta.image)}" />')
        tags.append(f'<meta data-seo="server" name="twitter:image" content="{escape(meta.image)}" />')
    if meta.noindex:
        tags.append('<meta data-seo="server" name="robots" content="noindex, nofollow" />')
    for block in meta.json_ld:
        payload = json.dumps(block, ensure_ascii=False).replace("</", "<\\/")
        tags.append(f'<script data-seo="server" type="application/ld+json">{payload}</script>')
    return "\n    ".join(tags)


async def build_sitemap(db: AsyncSession, request_base: str) -> str:
    base = site_url(request_base)
    entries: list[tuple[str, str | None]] = [(f"{base}/", None)]
    entries += [(f"{base}{path}", None) for path in STATIC_PAGES]

    categories = await db.execute(
        select(Category.slug).where(Category.is_active == True)  # noqa: E712
    )
    entries += [(f"{base}/category/{slug}", None) for slug in categories.scalars()]

    products = await db.execute(
        select(Product.slug, Product.created_at)
        .where(Product.is_active == True)  # noqa: E712
        .order_by(Product.id)
    )
    entries += [
        (f"{base}/products/{slug}", created.date().isoformat() if created else None) for slug, created in products.all()
    ]

    posts = await db.execute(
        select(BlogPost.slug, BlogPost.published_at).where(BlogPost.is_published == True)  # noqa: E712
    )
    entries += [
        (f"{base}/blog/{slug}", published.date().isoformat() if published else None) for slug, published in posts.all()
    ]

    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, lastmod in entries:
        lines.append("  <url>")
        lines.append(f"    <loc>{escape(loc)}</loc>")
        if lastmod:
            lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append("  </url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def build_robots(request_base: str) -> str:
    base = site_url(request_base)
    disallow = [*NOINDEX_PREFIXES, "/api/"]
    lines = ["User-agent: *", *(f"Disallow: {p}" for p in disallow), "", f"Sitemap: {base}/sitemap.xml"]
    return "\n".join(lines) + "\n"
