"""Dev seed for Shebliss — everything the storefront shows comes from here or the admin.

Creates:
  4 parent categories, each with 3 subcategories (with images)
  3 products per subcategory (36 products, 2 images each)
  Homepage banners: 3 hero slides, 1 editorial collection, 4 "Home collection" carousels
  1 corporate gifting banner
  3 published blog posts
  1 admin user + 1 regular user
  3 featured testimonials

Images are downloaded once from Unsplash and stored through the same pipeline as
admin uploads (WebP + responsive variants, local static/ or R2), so the database
only holds relative keys. If a download or upload fails, the remote URL is stored
instead so seeding still completes. Pass --no-download to skip downloading.

Run from the backend/ directory:
    source .venv/bin/activate
    python seed.py

Safe to re-run — existing rows are skipped (slug/email/title uniqueness).
Pass --reset to wipe seeded tables first.
"""

import asyncio
import io
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

from fastapi import UploadFile
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from starlette.datastructures import Headers

from app.core.security import hash_password
from app.db.models import Banner, BlogCategory, BlogPost, Category, Product, Testimonial, User
from app.utils import redis as redis_utils
from app.utils.image_upload import ImageStorageUnavailableError, upload_image_file

# ---------------------------------------------------------------------------
# DB connection
# ---------------------------------------------------------------------------

def _db_url() -> str:
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        from app.core.config import settings
        url = settings.DATABASE_URL or ""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if not url:
        sys.exit("ERROR: DATABASE_URL is not set.")
    return url


engine = create_async_engine(_db_url(), future=True)
Session = async_sessionmaker(engine, expire_on_commit=False)


# ---------------------------------------------------------------------------
# Source images (Unsplash photo ids)
# ---------------------------------------------------------------------------

def _unsplash(photo_id: str) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?w=1600&q=80&fm=jpg"


IMG = {
    "necklace_gold": _unsplash("1599643478518-a784e5dc4c8f"),
    "necklace_kundan": _unsplash("1610701596007-11502861dcfa"),
    "earrings_jhumka": _unsplash("1589128777073-263566ae5e4d"),
    "bangles": _unsplash("1573408301185-9146fe634ad0"),
    "rings": _unsplash("1605100804763-247f67b3557e"),
    "bridal": _unsplash("1611652022419-a9419f74343d"),
    "earrings_drop": _unsplash("1535632066927-ab7c9ab60908"),
    "necklace_long": _unsplash("1601121141461-9d6647bef0a1"),
    "editorial": _unsplash("1602173574767-37ac01994b2a"),
    "detail": _unsplash("1535632787350-4e68ef0ac584"),
}

_PRODUCT_IMAGES = [
    IMG["necklace_gold"],
    IMG["necklace_kundan"],
    IMG["earrings_jhumka"],
    IMG["bangles"],
    IMG["rings"],
    IMG["bridal"],
    IMG["earrings_drop"],
    IMG["necklace_long"],
]


# ---------------------------------------------------------------------------
# Data definitions — nothing references raw IDs; children reference parents by slug.
# ---------------------------------------------------------------------------

CATEGORY_TREE = [
    {
        "slug": "necklace-sets",
        "name": "Necklace Sets",
        "image": IMG["necklace_gold"],
        "sort_order": 1,
        "subcategories": [
            {"slug": "kundan-necklace-sets", "name": "Kundan Necklace Sets", "image": IMG["necklace_kundan"], "sort_order": 1},
            {"slug": "choker-sets", "name": "Choker Sets", "image": IMG["earrings_drop"], "sort_order": 2},
            {"slug": "long-sets", "name": "Long Sets", "image": IMG["necklace_long"], "sort_order": 3},
        ],
    },
    {
        "slug": "earrings",
        "name": "Earrings",
        "image": IMG["earrings_jhumka"],
        "sort_order": 2,
        "subcategories": [
            {"slug": "jhumkas", "name": "Jhumkas", "image": IMG["earrings_drop"], "sort_order": 1},
            {"slug": "chandbalis", "name": "Chandbalis", "image": IMG["bangles"], "sort_order": 2},
            {"slug": "studs", "name": "Studs", "image": IMG["rings"], "sort_order": 3},
        ],
    },
    {
        "slug": "bangles",
        "name": "Bangles",
        "image": IMG["bangles"],
        "sort_order": 3,
        "subcategories": [
            {"slug": "kada", "name": "Kada", "image": IMG["necklace_gold"], "sort_order": 1},
            {"slug": "bangle-set-4", "name": "Set of 4 Bangles", "image": IMG["bridal"], "sort_order": 2},
            {"slug": "bracelet", "name": "Bracelet", "image": IMG["rings"], "sort_order": 3},
        ],
    },
    {
        "slug": "wedding-jewellery",
        "name": "Wedding Jewellery",
        "image": IMG["bridal"],
        "sort_order": 4,
        "subcategories": [
            {"slug": "bridal-sets", "name": "Bridal Sets", "image": IMG["necklace_long"], "sort_order": 1},
            {"slug": "mang-tikka", "name": "Mang Tikka", "image": IMG["necklace_gold"], "sort_order": 2},
            {"slug": "waist-belt", "name": "Waist Belt", "image": IMG["bangles"], "sort_order": 3},
        ],
    },
]

# 3 products per subcategory — keyed by subcategory slug
# each entry: name, price, original_price, tags, color_hex.
# Tags drive the storefront: best-seller / trending / offers / new-arrival feed the
# homepage tabs and footer links; the others feed the Home collection carousels.
PRODUCTS: dict[str, list[dict]] = {
    "kundan-necklace-sets": [
        {"name": "Kundan Royal Choker Set", "price": 1499, "original_price": 1999, "tags": ["kundan", "best-seller", "bridal", "trending"], "color_hex": "#046c48"},
        {"name": "Heritage Kundan Layered Set", "price": 1899, "original_price": 2499, "tags": ["kundan", "festive", "offers"], "color_hex": "#c2185b"},
        {"name": "Kundan Emerald Necklace", "price": 2199, "original_price": 2999, "tags": ["kundan", "bridal", "new-arrival"], "color_hex": "#046c48"},
    ],
    "choker-sets": [
        {"name": "Gold Plated Choker Set", "price": 999, "original_price": 1499, "tags": ["18k-gold", "best-seller", "offers"], "color_hex": "#ffd700"},
        {"name": "Antique Choker with Earrings", "price": 1299, "original_price": 1799, "tags": ["antique", "festive"], "color_hex": "#722f37"},
        {"name": "Minimalist AD Choker", "price": 799, "original_price": 1099, "tags": ["everyday", "new-arrival", "trending"], "color_hex": "#c0c0c0"},
    ],
    "long-sets": [
        {"name": "Temple Long Haaram Set", "price": 2499, "original_price": 3299, "tags": ["temple", "bridal", "offers"], "color_hex": "#ffd700"},
        {"name": "Polki Long Necklace Set", "price": 1999, "original_price": 2699, "tags": ["polki", "festive", "trending"], "color_hex": "#046c48"},
        {"name": "South Indian Long Chain Set", "price": 1749, "original_price": 2299, "tags": ["temple", "traditional"], "color_hex": "#ffd700"},
    ],
    "jhumkas": [
        {"name": "Classic Kundan Jhumkas", "price": 599, "original_price": 899, "tags": ["kundan", "best-seller", "offers"], "color_hex": "#ffd700"},
        {"name": "Rani Pink Chandbali Jhumkas", "price": 699, "original_price": 999, "tags": ["festive", "new-arrival", "trending"], "color_hex": "#c2185b"},
        {"name": "Emerald Drop Jhumkas", "price": 799, "original_price": 1099, "tags": ["everyday", "bridal"], "color_hex": "#046c48"},
    ],
    "chandbalis": [
        {"name": "Antique Gold Chandbali", "price": 899, "original_price": 1199, "tags": ["antique", "bridal"], "color_hex": "#ffd700"},
        {"name": "Ruby Red Chandbali Earrings", "price": 749, "original_price": 999, "tags": ["festive", "best-seller"], "color_hex": "#9b111e"},
        {"name": "Peacock Enamel Chandbali", "price": 949, "original_price": 1299, "tags": ["festive", "new-arrival", "trending"], "color_hex": "#009B77"},
    ],
    "studs": [
        {"name": "Pearl Drop Studs", "price": 349, "original_price": 499, "tags": ["everyday", "minimal", "offers"], "color_hex": "#f0ead6"},
        {"name": "AD Flower Studs", "price": 299, "original_price": 449, "tags": ["everyday", "best-seller", "trending"], "color_hex": "#c0c0c0"},
        {"name": "Gold Plated Ball Studs", "price": 249, "original_price": 399, "tags": ["everyday", "minimal"], "color_hex": "#ffd700"},
    ],
    "kada": [
        {"name": "Antique Copper Finish Kada", "price": 799, "original_price": 1099, "tags": ["antique", "traditional"], "color_hex": "#722f37"},
        {"name": "Kundan Studded Kada", "price": 999, "original_price": 1399, "tags": ["kundan", "bridal"], "color_hex": "#ffd700"},
        {"name": "Simple Gold Plated Kada", "price": 599, "original_price": 849, "tags": ["everyday", "18k-gold", "offers"], "color_hex": "#ffd700"},
    ],
    "bangle-set-4": [
        {"name": "Kundan Stone Set of 4", "price": 849, "original_price": 1199, "tags": ["kundan", "festive", "best-seller", "trending"], "color_hex": "#046c48"},
        {"name": "Multicolor Enamel Bangles x4", "price": 699, "original_price": 999, "tags": ["festive", "new-arrival", "offers"], "color_hex": None},
        {"name": "Gold Polish Bangles Set of 4", "price": 749, "original_price": 999, "tags": ["18k-gold", "everyday"], "color_hex": "#ffd700"},
    ],
    "bracelet": [
        {"name": "Oxidised Silver Charm Bracelet", "price": 499, "original_price": 699, "tags": ["everyday", "minimal", "offers"], "color_hex": "#c0c0c0"},
        {"name": "Kundan Bracelet with Beads", "price": 649, "original_price": 899, "tags": ["kundan", "festive"], "color_hex": "#ffd700"},
        {"name": "AD Tennis Bracelet", "price": 549, "original_price": 799, "tags": ["everyday", "best-seller"], "color_hex": "#c0c0c0"},
    ],
    "bridal-sets": [
        {"name": "Full Bridal Kundan Set", "price": 4999, "original_price": 6999, "tags": ["kundan", "bridal", "best-seller", "offers"], "color_hex": "#ffd700"},
        {"name": "South Indian Bridal 7-Piece Set", "price": 5499, "original_price": 7499, "tags": ["temple", "bridal"], "color_hex": "#ffd700"},
        {"name": "Polki Bridal Set with Tikka", "price": 4499, "original_price": 5999, "tags": ["polki", "bridal", "new-arrival", "trending"], "color_hex": "#046c48"},
    ],
    "mang-tikka": [
        {"name": "Kundan Maang Tikka", "price": 799, "original_price": 1099, "tags": ["kundan", "bridal"], "color_hex": "#ffd700"},
        {"name": "Pearl Maang Tikka", "price": 599, "original_price": 849, "tags": ["bridal", "everyday"], "color_hex": "#f0ead6"},
        {"name": "Emerald Maang Tikka", "price": 999, "original_price": 1399, "tags": ["bridal", "festive", "trending"], "color_hex": "#046c48"},
    ],
    "waist-belt": [
        {"name": "Bridal Kamarband Gold", "price": 1499, "original_price": 2099, "tags": ["bridal", "temple"], "color_hex": "#ffd700"},
        {"name": "Kundan Waist Belt", "price": 1299, "original_price": 1799, "tags": ["kundan", "bridal"], "color_hex": "#046c48"},
        {"name": "Antique Saree Waist Belt", "price": 1099, "original_price": 1499, "tags": ["antique", "traditional", "offers"], "color_hex": "#ffd700"},
    ],
}

# Homepage and page banners. "home_collection" banners become the repeated
# banner + product carousel blocks; products_tag must match tags used in PRODUCTS.
BANNERS = [
    {
        "placement": "hero", "position": 0, "title": "Festive Edit",
        "subtitle": "Kundan, polki and temple pieces for the season",
        "cta_text": "Shop Festive", "cta_link": "/products?tags=festive",
        "image": IMG["necklace_gold"], "bg_color": "#14342B", "text_color": "#F9F8F6",
    },
    {
        "placement": "hero", "position": 1, "title": "Bridal Collection",
        "subtitle": "Complete looks for the big day",
        "cta_text": "Shop Bridal", "cta_link": "/products?tags=bridal",
        "image": IMG["bridal"], "bg_color": "#14342B", "text_color": "#F9F8F6",
    },
    {
        "placement": "hero", "position": 2, "title": "New Arrivals",
        "subtitle": "Fresh designs added every week",
        "cta_text": "Shop New", "cta_link": "/products?tags=new-arrival",
        "image": IMG["necklace_kundan"], "bg_color": "#14342B", "text_color": "#F9F8F6",
    },
    {
        "placement": "editorial", "position": 0, "title": "The Kundan|Collection",
        "subtitle": "Hand-set kundan on an 18k gold plated anti-tarnish base, finished to feel like a family heirloom.",
        "badge_text": "Featured Collection", "cta_text": "Shop the Collection",
        "cta_link": "/products?tags=kundan", "products_tag": "kundan",
        "image": IMG["editorial"], "bg_color": "#EFECE6", "text_color": "#1A1A1A",
    },
    {
        "placement": "home_collection", "position": 0, "title": "Bridal Bliss",
        "subtitle": "Everything for the wedding season", "badge_text": "Wedding Edit",
        "cta_text": "Shop Bridal", "cta_link": "/products?tags=bridal", "products_tag": "bridal",
        "image": IMG["bridal"],
    },
    {
        "placement": "home_collection", "position": 1, "title": "Festive Favourites",
        "subtitle": "Colour, sparkle and celebration", "badge_text": "Festive",
        "cta_text": "Shop Festive", "cta_link": "/products?tags=festive", "products_tag": "festive",
        "image": IMG["necklace_kundan"],
    },
    {
        "placement": "home_collection", "position": 2, "title": "Everyday Elegance",
        "subtitle": "Light pieces made for daily wear", "badge_text": "Daily Wear",
        "cta_text": "Shop Everyday", "cta_link": "/products?tags=everyday", "products_tag": "everyday",
        "image": IMG["rings"],
    },
    {
        "placement": "home_collection", "position": 3, "title": "Temple & Antique",
        "subtitle": "Traditional craft, timeless finish", "badge_text": "Heritage",
        "cta_text": "Shop Heritage", "cta_link": "/products?tags=antique", "products_tag": "antique",
        "image": IMG["necklace_long"],
    },
    {
        "placement": "corporate_gifting", "position": 0, "title": "Corporate Gifting",
        "cta_text": "Enquire Now", "cta_link": "#corporate-inquiry",
        "image": IMG["bangles"], "bg_color": "#0a3b2c", "text_color": "#F9F8F6",
    },
]

BLOG_POSTS = [
    {
        "slug": "how-to-style-statement-earrings",
        "title": "How to Style Statement Earrings for Every Occasion",
        "excerpt": "From boardroom to brunch, a guide to wearing bold jewellery with confidence.",
        "content": "<p>Statement earrings change an outfit on their own. Keep the neckline simple, pull your hair back and let one bold pair carry the look.</p><p>For work, choose studs or small chandbalis. For festive evenings, go big with jhumkas in kundan or enamel.</p>",
        "category": BlogCategory.GUIDES,
        "image": IMG["earrings_drop"],
        "days_ago": 3,
    },
    {
        "slug": "care-guide-gold-plated-jewellery",
        "title": "The Ultimate Care Guide for Gold Plated Jewellery",
        "excerpt": "Keep your pieces looking new with a few simple care rituals.",
        "content": "<p>Store each piece separately in a soft pouch, away from moisture. Put jewellery on after perfume and lotion, and wipe it with a dry cloth after wearing.</p>",
        "category": BlogCategory.TIPS,
        "image": IMG["bangles"],
        "days_ago": 10,
    },
    {
        "slug": "bridal-jewellery-trends",
        "title": "Bridal Jewellery Trends to Watch This Season",
        "excerpt": "Kundan revival, layered sets and minimal mangalsutras are taking centre stage.",
        "content": "<p>Brides are mixing heirloom-style kundan with lighter layered sets, and choosing pieces they can wear again after the wedding.</p>",
        "category": BlogCategory.NEWS,
        "image": IMG["bridal"],
        "days_ago": 20,
    },
]

USERS = [
    {"email": "admin@shebliss.com", "full_name": "Shebliss Admin", "is_admin": True, "password": "admin123"},
    {"email": "demo@shebliss.com", "full_name": "Demo User", "is_admin": False, "password": "demo123"},
]

TESTIMONIALS = [
    {
        "name": "Priya Sharma",
        "rating": 5,
        "quote": "The quality of the kundan set exceeded my expectations. Wore it at my sister's wedding and got so many compliments!",
        "item_purchased": "Kundan Royal Choker Set",
        "location": "Mumbai",
        "is_verified": True,
        "is_featured": True,
    },
    {
        "name": "Ananya Reddy",
        "rating": 5,
        "quote": "Fast delivery and beautiful packaging. The jhumkas are exactly as shown — love Shebliss!",
        "item_purchased": "Classic Kundan Jhumkas",
        "location": "Hyderabad",
        "is_verified": True,
        "is_featured": True,
    },
    {
        "name": "Meera Iyer",
        "rating": 4,
        "quote": "Lightweight bangles that look far more expensive than they are. I wear them almost every day.",
        "item_purchased": "Gold Polish Bangles Set of 4",
        "location": "Chennai",
        "is_verified": True,
        "is_featured": True,
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slugify(text: str) -> str:
    import re
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    return re.sub(r"-+", "-", s).strip("-")


def _pick_image(index: int) -> str:
    return _PRODUCT_IMAGES[index % len(_PRODUCT_IMAGES)]


def _build_variants(color_hex: str | None) -> dict | None:
    """Build a simple colour variant group when a hex is provided."""
    if not color_hex:
        return None
    return {
        "variant_groups": [
            {
                "id": "colour",
                "label": "Colour",
                "required": False,
                "options": [
                    {
                        "id": "colour-1",
                        "name": "Default",
                        "price": 0,
                        "color_hex": color_hex,
                        "color_family": None,  # admin fills this in after seeding
                    }
                ],
            }
        ],
        "stock_map": {"colour-1": 20},
    }


class ImageStore:
    """Downloads each source image once and stores a copy per use, like an admin upload."""

    def __init__(self, download: bool) -> None:
        self.download = download
        self._bytes: dict[str, bytes | None] = {}

    def _fetch(self, url: str) -> bytes | None:
        req = urllib.request.Request(url, headers={"User-Agent": "shebliss-seed"})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read()
        except Exception as exc:
            print(f"  WARN: could not download {url}: {exc}")
            return None

    async def store(self, url: str, folder: str, entity_id: int) -> str:
        if not self.download:
            return url
        if url not in self._bytes:
            self._bytes[url] = await asyncio.to_thread(self._fetch, url)
        data = self._bytes[url]
        if data is None:
            return url
        upload = UploadFile(
            file=io.BytesIO(data),
            filename="seed.jpg",
            headers=Headers({"content-type": "image/jpeg"}),
        )
        try:
            return await upload_image_file(upload, folder=folder, entity_id=entity_id)
        except ImageStorageUnavailableError as exc:
            print(f"  WARN: image storage unavailable ({exc}); storing remote URL instead")
            self.download = False
            return url


async def _exists(db, sql: str, **params) -> bool:
    row = await db.execute(text(sql), params)
    return row.scalar_one_or_none() is not None


async def _flush_storefront_cache() -> None:
    await redis_utils.init_redis()
    if not redis_utils.redis_client:
        return
    for pattern in ("products:*", "product:*", "banners:*", "cats:*", "blog:*"):
        await redis_utils.cache_delete_pattern(pattern)
    await redis_utils.close_redis()
    print("  cleared storefront cache")


# ---------------------------------------------------------------------------
# Seed logic
# ---------------------------------------------------------------------------

async def seed(reset: bool = False, download: bool = True) -> None:
    images = ImageStore(download)
    async with Session() as db:
        if reset:
            print("⚠  Resetting products, categories, banners, blog, users, testimonials …")
            for table in (
                "testimonials", "product_reviews", "cart_items", "order_items",
                "products", "categories", "banners", "blog_posts", "users",
            ):
                await db.execute(text(f"DELETE FROM {table}"))
            await db.commit()

        # 1. Users
        for u in USERS:
            if await _exists(db, "SELECT id FROM users WHERE email = :e", e=u["email"]):
                print(f"  skip user  {u['email']}")
                continue
            db.add(User(
                email=u["email"],
                full_name=u["full_name"],
                hashed_password=hash_password(u["password"]),
                is_admin=u["is_admin"],
                is_active=True,
            ))
            print(f"  + user     {u['email']}")
        await db.commit()

        # 2. Categories (parents first, then children)
        async def upsert_category(defn: dict, parent_id: int | None) -> int:
            row = await db.execute(
                text("SELECT id FROM categories WHERE slug = :s"), {"s": defn["slug"]}
            )
            existing_id = row.scalar_one_or_none()
            if existing_id:
                print(f"  skip cat   {defn['slug']}")
                return existing_id
            cat = Category(
                name=defn["name"],
                slug=defn["slug"],
                sort_order=defn["sort_order"],
                parent_id=parent_id,
                is_active=True,
            )
            db.add(cat)
            await db.flush()
            cat.image_url = await images.store(defn["image"], "categories", cat.id)
            print(f"  + cat      {defn['slug']}")
            return cat.id

        for parent_def in CATEGORY_TREE:
            parent_id = await upsert_category(parent_def, None)
            for sub_def in parent_def["subcategories"]:
                await upsert_category(sub_def, parent_id)
        await db.commit()

        # 3. Products
        img_counter = 0
        for sub_slug, product_list in PRODUCTS.items():
            row = await db.execute(
                text("SELECT id FROM categories WHERE slug = :s"), {"s": sub_slug}
            )
            cat_id = row.scalar_one_or_none()
            if not cat_id:
                print(f"  WARN: subcategory '{sub_slug}' not found, skipping its products")
                continue

            for p in product_list:
                slug = _slugify(p["name"])
                if await _exists(db, "SELECT id FROM products WHERE slug = :s", s=slug):
                    print(f"  skip prod  {slug}")
                    img_counter += 1
                    continue

                product = Product(
                    name=p["name"],
                    slug=slug,
                    description=f"Beautiful {p['name'].lower()} — handcrafted with premium artificial jewellery.",
                    price=float(p["price"]),
                    original_price=float(p["original_price"]),
                    stock_qty=20,
                    category_id=cat_id,
                    images=[],
                    tags=p["tags"],
                    is_active=True,
                    variants=_build_variants(p.get("color_hex")),
                )
                db.add(product)
                await db.flush()
                product.images = [
                    await images.store(_pick_image(img_counter), "products", product.id),
                    await images.store(_pick_image(img_counter + 1), "products", product.id),
                ]
                print(f"  + product  {slug}")
                img_counter += 1
        await db.commit()

        # 4. Banners (hero, editorial, home collection carousels, corporate gifting)
        for b in BANNERS:
            if await _exists(
                db,
                "SELECT id FROM banners WHERE placement = :p AND title = :t",
                p=b["placement"], t=b["title"],
            ):
                print(f"  skip banner {b['placement']}: {b['title']}")
                continue
            banner = Banner(
                title=b["title"],
                subtitle=b.get("subtitle"),
                cta_text=b.get("cta_text"),
                cta_link=b.get("cta_link"),
                badge_text=b.get("badge_text"),
                bg_color=b.get("bg_color", "#F5F0E8"),
                text_color=b.get("text_color", "#1B4332"),
                position=b["position"],
                placement=b["placement"],
                products_tag=b.get("products_tag"),
                is_active=True,
            )
            db.add(banner)
            await db.flush()
            key = await images.store(b["image"], "banners", banner.id)
            banner.image_url = key
            banner.image_public_id = None if key.startswith("http") else key
            print(f"  + banner   {b['placement']}: {b['title']}")
        await db.commit()

        # 5. Blog posts
        now = datetime.now(timezone.utc)
        for post in BLOG_POSTS:
            if await _exists(db, "SELECT id FROM blog_posts WHERE slug = :s", s=post["slug"]):
                print(f"  skip blog  {post['slug']}")
                continue
            row = BlogPost(
                title=post["title"],
                slug=post["slug"],
                excerpt=post["excerpt"],
                content=post["content"],
                category=post["category"],
                author_name="Shebliss Team",
                is_published=True,
                published_at=now - timedelta(days=post["days_ago"]),
            )
            db.add(row)
            await db.flush()
            row.cover_image_url = await images.store(post["image"], "blog", row.id)
            print(f"  + blog     {post['slug']}")
        await db.commit()

        # 6. Testimonials
        for t in TESTIMONIALS:
            if await _exists(
                db,
                "SELECT id FROM testimonials WHERE name = :n AND quote = :q",
                n=t["name"], q=t["quote"],
            ):
                print(f"  skip test  {t['name']}")
                continue
            db.add(Testimonial(**t))
            print(f"  + test     {t['name']}")
        await db.commit()

    await _flush_storefront_cache()
    print("\n✅  Seed complete.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    asyncio.run(seed(reset="--reset" in sys.argv, download="--no-download" not in sys.argv))
