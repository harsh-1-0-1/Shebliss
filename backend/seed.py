"""Seed script: Shebliss artificial jewellery catalog.

Usage:
    uv run python seed.py
"""

import asyncio
import os
import random
import re
import sys
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.db.models import (
    Address, Banner, BlogCategory, BlogPost, Cart, CartItem,
    Category, Order, OrderItem, Product, ProductReview, User,
)


def _resolve_database_url() -> str | None:
    url = os.environ.get("DATABASE_URL")
    if not url:
        from app.core.config import settings
        url = settings.DATABASE_URL
    if not url:
        return None
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


_db_url = _resolve_database_url()
if _db_url:
    engine = create_async_engine(_db_url, future=True)
    async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
else:
    engine = None
    async_session_factory = None

UNSPLASH = "https://images.unsplash.com/photo-{id}?w=600&q=80"

PRODUCT_IMAGES = [
    UNSPLASH.format(id="1611591437281-460bfbe1220a"),
    UNSPLASH.format(id="1599643478518-a784e5dc4c8f"),
    UNSPLASH.format(id="1573408301185-9146fe634ad0"),
    UNSPLASH.format(id="1611652022419-a9419f74343d"),
    UNSPLASH.format(id="1590779033100-9f60a05a013d"),
    UNSPLASH.format(id="1610701596007-11502861dcfa"),
    UNSPLASH.format(id="1589128777073-263566ae5e4d"),
    UNSPLASH.format(id="1515562141207-7a88fb7ce338"),
    UNSPLASH.format(id="1605100804763-247f67b3557e"),
    UNSPLASH.format(id="1630019852942-f89202989a59"),
    UNSPLASH.format(id="1635767798638-3e25273a8236"),
    UNSPLASH.format(id="1600080972464-8e5f35f63d08"),
    UNSPLASH.format(id="1617038220319-276d3cfab638"),
    UNSPLASH.format(id="1535632066927-ab7c9ab60908"),
]

CATEGORIES = [
    # Top-level
    {"name": "Earrings", "slug": "earrings", "parent_id": None},
    {"name": "Necklaces", "slug": "necklaces", "parent_id": None},
    {"name": "Bangles & Bracelets", "slug": "bangles", "parent_id": None},
    {"name": "Bridal", "slug": "bridal-sets", "parent_id": None},
    {"name": "Mangalsutra & Sets", "slug": "mangalsutra", "parent_id": None},
    {"name": "Gift Sets", "slug": "gift-sets", "parent_id": None},
    # Earrings subcategories
    {"name": "Jhumkas", "slug": "jhumkas", "parent_slug": "earrings"},
    {"name": "Studs", "slug": "studs", "parent_slug": "earrings"},
    {"name": "Drops & Dangles", "slug": "drops-dangles", "parent_slug": "earrings"},
    {"name": "Chandbalis", "slug": "chandbalis", "parent_slug": "earrings"},
    # Necklaces subcategories
    {"name": "Chokers", "slug": "chokers", "parent_slug": "necklaces"},
    {"name": "Chains", "slug": "chains", "parent_slug": "necklaces"},
    {"name": "Rani Haars", "slug": "rani-haars", "parent_slug": "necklaces"},
    {"name": "Pendants", "slug": "pendants", "parent_slug": "necklaces"},
    # Bangles & Bracelets subcategories
    {"name": "Kadas", "slug": "kadas", "parent_slug": "bangles"},
    {"name": "Bracelets", "slug": "bracelets", "parent_slug": "bangles"},
    # Bridal subcategories
    {"name": "Maang Tikkas", "slug": "maang-tikkas", "parent_slug": "bridal-sets"},
    {"name": "Nath & Nose Pins", "slug": "nath-nose-pins", "parent_slug": "bridal-sets"},
    {"name": "Hair Accessories", "slug": "hair-accessories", "parent_slug": "bridal-sets"},
    # Mangalsutra & Sets subcategories
    {"name": "Necklace Sets", "slug": "necklace-sets", "parent_slug": "mangalsutra"},
    {"name": "Temple Jewellery", "slug": "temple-jewellery", "parent_slug": "mangalsutra"},
    {"name": "Rings", "slug": "rings", "parent_slug": "mangalsutra"},
]


def _make_variants(base_price: int, stock_per_option: int = 12) -> dict:
    """Shebliss variant: Select Colour (carries price) + Select Finish (add-on)."""
    def oid(): return f"opt_{uuid.uuid4().hex[:8]}"

    colours = [
        {"id": oid(), "name": "Gold",       "price": base_price, "stock": stock_per_option},
        {"id": oid(), "name": "Rose Gold",  "price": base_price + 200, "stock": stock_per_option},
        {"id": oid(), "name": "Silver",     "price": base_price, "stock": stock_per_option},
    ]
    finishes = [
        {"id": oid(), "name": "Standard",       "price": 0,   "stock": stock_per_option},
        {"id": oid(), "name": "Antique Finish", "price": 150, "stock": stock_per_option},
        {"id": oid(), "name": "High Polish",    "price": 200, "stock": stock_per_option},
    ]
    return {
        "variant_groups": [
            {"id": f"vg_{uuid.uuid4().hex[:8]}", "label": "Select Colour", "options": colours},
            {"id": f"vg_{uuid.uuid4().hex[:8]}", "label": "Select Finish", "options": finishes},
        ],
        "default_image": UNSPLASH.format(id="1611591437281-460bfbe1220a"),
    }


def _make_size_variants(base_price: int, stock_per_option: int = 15) -> dict:
    """Shebliss variant for rings/bangles: Select Size (absolute prices)."""
    def oid(): return f"opt_{uuid.uuid4().hex[:8]}"

    sizes = [
        {"id": oid(), "name": "Small",  "price": base_price,      "stock": stock_per_option},
        {"id": oid(), "name": "Medium", "price": base_price + 100, "stock": stock_per_option},
        {"id": oid(), "name": "Large",  "price": base_price + 200, "stock": stock_per_option},
    ]
    return {
        "variant_groups": [
            {"id": f"vg_{uuid.uuid4().hex[:8]}", "label": "Select Size", "options": sizes},
        ],
        "default_image": "",
    }


def _make_length_variants(base_price: int) -> dict:
    """Shebliss variant for chains/necklaces: Select Length (absolute prices)."""
    def oid(): return f"opt_{uuid.uuid4().hex[:8]}"

    lengths = [
        {"id": oid(), "name": '16" Choker',       "price": base_price, "stock": 12},
        {"id": oid(), "name": '18" Princess',     "price": base_price + 200, "stock": 12},
        {"id": oid(), "name": '24" Matinee',      "price": base_price + 400, "stock": 12},
    ]
    return {
        "variant_groups": [
            {"id": f"vg_{uuid.uuid4().hex[:8]}", "label": "Select Length", "options": lengths},
        ],
        "default_image": "",
    }


PRODUCTS = [
    # ── Earrings ──
    {"name": "Meenakari Jhumka Earrings", "cat": "jhumkas", "price": 549,
     "desc": "Hand-enamelled meenakari jhumkas with a traditional dandiya finish — featherlight for all-day wear.",
     "tags": ["earrings", "jhumkas", "festive", "daily-wear"], "badge": "Bestseller",
     "variants": _make_variants(549)},
    {"name": "Kundan Chandelier Jhumkas", "cat": "jhumkas", "price": 799,
     "desc": "Multi-layered chandelier jhumkas set with shimmering kundan stones and pearl dangles.",
     "tags": ["earrings", "jhumkas", "bridal", "kundan"], "badge": "Trending",
     "variants": _make_variants(799)},
    {"name": "Gold-Plated Teardrop Studs", "cat": "studs", "price": 349,
     "desc": "Minimal gold-plated teardrop studs that go from office to evening without missing a beat.",
     "tags": ["earrings", "studs", "daily-wear"], "badge": "New",
     "variants": _make_variants(349)},
    {"name": "Cubic Zirconia Stud Set", "cat": "studs", "price": 399,
     "desc": "A set of four classic cubic zirconia studs with a brilliant, diamond-like sparkle.",
     "tags": ["earrings", "studs", "daily-wear"], "badge": "Value Pack",
     "variants": _make_variants(399)},
    {"name": "Baroque Pearl Drop Earrings", "cat": "drops-dangles", "price": 649,
     "desc": "Twin baroque pearls suspended on textured gold drops for a quiet, romantic glow.",
     "tags": ["earrings", "drops", "pearl", "festive"], "badge": "Trending",
     "variants": _make_variants(649)},
    {"name": "Filigree Dangle Earrings", "cat": "drops-dangles", "price": 599,
     "desc": "Intricate filigree dangles crafted to echo vintage heirloom metalwork.",
     "tags": ["earrings", "drops", "antique", "festive"],
     "variants": _make_variants(599)},
    {"name": "Oxidised Chandbali Earrings", "cat": "chandbalis", "price": 699,
     "desc": "Half-moon chandbalis with a matte oxidised finish and dainty hanging beads.",
     "tags": ["earrings", "chandbalis", "antique"], "badge": "Popular",
     "variants": _make_variants(699)},
    # ── Necklaces ──
    {"name": "Layered Kundan Choker", "cat": "chokers", "price": 899,
     "desc": "A regal layered choker stacked with kundan rosettes and pearl cascades.",
     "tags": ["necklaces", "chokers", "bridal", "kundan"], "badge": "Bestseller",
     "variants": _make_variants(899)},
    {"name": "American Diamond Choker", "cat": "chokers", "price": 749,
     "desc": "Brilliant-cut american diamonds in a structured collar for instant glamour.",
     "tags": ["necklaces", "chokers", "party"], "badge": "Trending",
     "variants": _make_variants(749)},
    {"name": "Minimal Gold Chain", "cat": "chains", "price": 399,
     "desc": "A slim, everyday gold chain that layers beautifully with pendants.",
     "tags": ["necklaces", "chains", "daily-wear"], "badge": "New",
     "variants": _make_length_variants(399)},
    {"name": "Rose Gold Bead Chain", "cat": "chains", "price": 449,
     "desc": "Soft rose-gold beads on a delicate chain — quiet luxury for everyday.",
     "tags": ["necklaces", "chains", "daily-wear"],
     "variants": _make_length_variants(449)},
    {"name": "Temple Design Rani Haar", "cat": "rani-haars", "price": 1499,
     "desc": "A statement rani haar with temple-style motifs and a matching pendant drop.",
     "tags": ["necklaces", "rani-haar", "bridal", "temple"], "badge": "Luxury",
     "variants": _make_variants(1499)},
    {"name": "Antique Polki Pendant Set", "cat": "pendants", "price": 999,
     "desc": "Uncut polki-style pendant with chain, finished in an aged antique tone.",
     "tags": ["necklaces", "pendants", "polki", "antique"], "badge": "Popular",
     "variants": _make_variants(999)},
    # ── Bangles & Bracelets ──
    {"name": "Gold Plated Bangle Set (Pack of 3)", "cat": "bangles", "price": 599,
     "desc": "Three stackable gold-plated bangles with delicate etching — a wardrobe staple.",
     "tags": ["bangles", "daily-wear", "festive"], "badge": "Value Pack",
     "variants": _make_variants(599)},
    {"name": "Meenakari Bangle Set", "cat": "bangles", "price": 649,
     "desc": "Enamelled meenakari bangles in festive jewel tones, sold as a matching pair.",
     "tags": ["bangles", "meenakari", "festive"], "badge": "Trending",
     "variants": _make_variants(649)},
    {"name": "Oxidised Kada Pair", "cat": "kadas", "price": 699,
     "desc": "Rugged yet refined oxidised kadas with hand-hammered detailing.",
     "tags": ["kadas", "antique", "festive"],
     "variants": _make_variants(699)},
    {"name": "Kundan Stone Bracelet", "cat": "bracelets", "price": 449,
     "desc": "A slim kundan-studded bracelet with a secure toggle clasp.",
     "tags": ["bracelets", "kundan", "daily-wear"],
     "variants": _make_variants(449)},
    # ── Bridal ──
    {"name": "Complete Bridal Set", "cat": "bridal-sets", "price": 2999, "op": 3999,
     "desc": "Necklace, chandelier earrings and maang tikke in one heirloom-worthy bridal set.",
     "tags": ["bridal", "kundan", "set"], "badge": "Bridal Pick",
     "variants": _make_variants(2999)},
    {"name": "Floral Maang Tikka", "cat": "maang-tikkas", "price": 349,
     "desc": "A dainty floral maang tikka with a velvet ribbon back — fits every hair style.",
     "tags": ["bridal", "maang-tikka", "daily-wear"],
     "variants": _make_variants(349)},
    {"name": "Polki Nath (Nose Pin)", "cat": "nath-nose-pins", "price": 399,
     "desc": "A classic polki nath with a chain, sized for the bridge of the nose.",
     "tags": ["bridal", "nath", "polki"], "badge": "New",
     "variants": _make_variants(399)},
    {"name": "Pearl Hair Pins (Pack of 4)", "cat": "hair-accessories", "price": 249,
     "desc": "Four pearl-tipped hair pins to tuck into braids, buns and updos.",
     "tags": ["bridal", "hair", "pearl"],
     "variants": _make_variants(249)},
    # ── Mangalsutra & Sets ──
    {"name": "Traditional Black Bead Mangalsutra", "cat": "mangalsutra", "price": 899,
     "desc": "Classic black bead mangalsutra with a gold-plated diamond-cut pendant.",
     "tags": ["mangalsutra", "daily-wear", "traditional"], "badge": "Bestseller",
     "variants": _make_variants(899)},
    {"name": "Gold Plated Mangalsutra Chain", "cat": "mangalsutra", "price": 1099,
     "desc": "A modern gold-plated mangalsutra on a delicate chain with a lustrous pendant.",
     "tags": ["mangalsutra", "daily-wear", "modern"], "badge": "Trending",
     "variants": _make_variants(1099)},
    {"name": "Kundan Necklace Set (Necklace + Earrings)", "cat": "necklace-sets", "price": 1299,
     "desc": "Matching kundan necklace and earrings set — fuss-free elegance for any festive night.",
     "tags": ["sets", "kundan", "festive"], "badge": "Popular",
     "variants": _make_variants(1299)},
    {"name": "Temple Necklace Set", "cat": "temple-jewellery", "price": 1399,
     "desc": "An ornate temple-style necklace and jhumka set with etched lakshmi motifs.",
     "tags": ["sets", "temple", "bridal"], "badge": "Luxury",
     "variants": _make_variants(1399)},
    {"name": "Adjustable Ring Set (Pack of 5)", "cat": "rings", "price": 499,
     "desc": "Five adjustable cocktail rings in mixed metallics — one for every mood.",
     "tags": ["rings", "daily-wear", "party"], "badge": "Value Pack",
     "variants": _make_variants(499)},
    {"name": "Antique Cocktail Ring", "cat": "rings", "price": 549,
     "desc": "A statement antique-finish ring with a deep emerald cabochon centre.",
     "tags": ["rings", "antique", "party"], "badge": "Trending",
     "variants": _make_size_variants(549)},
    # ── Gift Sets ──
    {"name": "Signature Jewellery Gift Box", "cat": "gift-sets", "price": 1999, "op": 2999,
     "desc": "Our curated gift box: earrings, bracelet and chain, packed in a velvet box.",
     "tags": ["combo", "gifting", "bundle"], "badge": "Gift",
     "variants": _make_variants(1999)},
    {"name": "Bride-to-Be Gift Set", "cat": "gift-sets", "price": 2499, "op": 3499,
     "desc": "A bridal starter set — tikka, jhumkas and choker — ready to gift in style.",
     "tags": ["combo", "gifting", "bundle", "bridal"], "badge": "Gift",
     "variants": _make_variants(2499)},
]


BLOG_POSTS = [
    {
        "title": "How to Care for Your Artificial Jewellery",
        "excerpt": "Simple habits that keep your gold-plated and kundan pieces shining for years.",
        "category": BlogCategory.TIPS,
        "cover": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=80",
        "author": "Shebliss Editorial",
        "content": """## Keeping Your Jewellery Lustrous

A few minutes of care keeps every piece looking freshly polished.

### 1. Keep It Dry
Remove jewellery before washing hands, showering, or swimming. Moisture dulls plating.

### 2. Store Separately
Keep each piece in its own pouch or box to avoid scratches and tangling.

### 3. Clean Gently
Use a soft, dry microfibre cloth after every wear. Avoid harsh chemical dips.

### 4. Spray Before, Wear After
Apply perfume and hairspray first, then put your jewellery on.

### 5. Rotate Your Pieces
Let plated pieces rest a day between wears so the finish lasts longer.""",
    },
    {
        "title": "Choosing Jewellery for Your Wedding Day",
        "excerpt": "From kundan sets to polki jhumkas — how to match jewellery to your bridal look.",
        "category": BlogCategory.GUIDES,
        "cover": "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&q=80",
        "author": "Shebliss Editorial",
        "content": """## The Bridal Edit

Your jewellery should echo your outfit, never compete with it.

### 1. Start With the Lehenga
Pick your outfit first, then choose jewellery that pulls out its colours and metal tones.

### 2. Balance the Neckline
- Deep necklines call for statement chokers.
- High necks pair best with earrings and maang tikka.

### 3. Layer in Moderation
Choose one hero piece — a rani haar or chandelier jhumkas — and keep the rest simple.

### 4. Match Metals
If your lehenga has gold zari, lean into gold and kundan rather than silver.

### 5. Test Comfort
You'll wear this for 12+ hours. Weight and grip matter as much as sparkle.""",
    },
    {
        "title": "The Story Behind Kundan Craftsmanship",
        "excerpt": "Why the age-old art of kundan setting still feels like the crown jewel of Indian design.",
        "category": BlogCategory.STORIES,
        "cover": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=80",
        "author": "Shebliss Editorial",
        "content": """## A Craft Passed Down Generations

Kundan is the art of setting stones in pure, uncast gold foil — a technique perfected in Rajasthan's royal ateliers.

### What Makes Kundan Special
The stone isn't held by prongs. It sits in a bed of foil that is pushed over its edges, creating a rich, continuous sparkle.

### Why It Endures
Modern kundan-made jewellery captures that regal glow at a fraction of the cost — heirloom beauty, made accessible.

### Our Take
We craft every Shebliss kundan piece with the same respect for the technique, so the tradition stays alive on your wedding day.""",
    },
    {
        "title": "Festive Jewellery Trends for This Season",
        "excerpt": "Temple haars, chandbalis and meenakari — the pieces our customers can't stop wearing.",
        "category": BlogCategory.NEWS,
        "cover": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1200&q=80",
        "author": "Shebliss Editorial",
        "content": """## What's Trending

This festive season, heritage is having a major moment.

### Temple Jewellery
Motifs inspired by temple architecture are showing up in necklaces, haars and earrings.

### Colourful Meenakari
Bright enamels in emerald, terracotta and ivory are pairing with traditional silhouettes.

### Oxidised Antiques
Matte oxidised finishes offer an effortless, bohemian take on festive dressing.

### Pearl Everywhere
From drop earrings to hair pins, pearls add a soft, romantic note to every look.""",
    },
]


def _pick_images() -> list[str]:
    return random.sample(PRODUCT_IMAGES, k=random.randint(1, 3))


def _original_price(price: float) -> float:
    markup = random.uniform(1.15, 1.50)
    return round(price * markup)


async def seed() -> None:
    if not async_session_factory or not engine:
        print("DATABASE_URL not set – skipping seed.")
        return
    async with async_session_factory() as db:
        # Clear in dependency order (children first, then parents)
        await db.execute(CartItem.__table__.delete())
        await db.execute(Cart.__table__.delete())
        await db.execute(OrderItem.__table__.delete())
        await db.execute(Order.__table__.delete())
        await db.execute(Address.__table__.delete())
        await db.execute(ProductReview.__table__.delete())
        await db.execute(Banner.__table__.delete())
        await db.execute(Product.__table__.delete())
        await db.execute(Category.__table__.delete())
        await db.execute(BlogPost.__table__.delete())
        await db.execute(User.__table__.delete())
        await db.flush()
        print("Cleared existing data.\n")

        # Admin user
        admin = User(
            email="admin@example.com",
            hashed_password=hash_password("adminadmin"),
            full_name="Admin",
            is_active=True,
            is_admin=True,
        )
        db.add(admin)
        await db.flush()
        print(f"  Admin user: {admin.email} (id={admin.id})")

        slug_to_id: dict[str, int] = {}

        for cat_data in CATEGORIES:
            parent_id = cat_data.get("parent_id")
            parent_slug = cat_data.get("parent_slug")
            if parent_slug:
                parent_id = slug_to_id.get(parent_slug)

            cat = Category(
                name=cat_data["name"],
                slug=cat_data["slug"],
                parent_id=parent_id,
                is_active=True,
            )
            db.add(cat)
            await db.flush()
            await db.refresh(cat)
            slug_to_id[cat.slug] = cat.id
            print(f"  Category: {cat.name} (id={cat.id})")

        for p in PRODUCTS:
            cat_id = slug_to_id[p["cat"]]
            slug = p["name"].lower().strip()
            slug = re.sub(r"[^\w\s-]", "", slug)
            slug = re.sub(r"[\s_]+", "-", slug)
            slug = re.sub(r"-+", "-", slug).strip("-")

            variants = p.get("variants")
            if variants and "variant_groups" in variants:
                # New format: sum stock across all options in the first group
                all_stocks = [
                    int(opt.get("stock", 0))
                    for grp in variants["variant_groups"]
                    for opt in grp.get("options", [])
                ]
                stock_qty = sum(all_stocks) if all_stocks else random.randint(5, 200)
            else:
                stock_qty = random.randint(5, 200)

            product = Product(
                name=p["name"],
                slug=slug,
                description=p.get("desc", ""),
                price=p["price"],
                original_price=p["op"] if "op" in p else _original_price(p["price"]),
                stock_qty=stock_qty,
                category_id=cat_id,
                images=_pick_images(),
                tags=p.get("tags", []),
                badge=p.get("badge"),
                variants=variants,
                is_active=True,
            )
            db.add(product)

        for bp in BLOG_POSTS:
            slug = bp["title"].lower().strip()
            slug = re.sub(r"[^\w\s-]", "", slug)
            slug = re.sub(r"[\s_]+", "-", slug)
            slug = re.sub(r"-+", "-", slug).strip("-")

            post = BlogPost(
                title=bp["title"],
                slug=slug,
                excerpt=bp["excerpt"],
                content=bp["content"],
                cover_image_url=bp["cover"],
                category=bp["category"],
                author_name=bp["author"],
                is_published=True,
                published_at=datetime.now(timezone.utc),
            )
            db.add(post)

        banners_seed = [
            Banner(
                title="Timeless Craft, Joyful Prices",
                subtitle="Artificial jewellery designed to feel heirloom — handcrafted kundan, polki and temple pieces.",
                cta_text="Shop the Collection",
                cta_link="/products",
                badge_text="Up to 40% Off",
                placement="hero",
                position=0,
                bg_color="#0E4D3A",
                text_color="#F8F4EC",
                image_url="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1400&h=600&fit=crop&crop=center",
            ),
            Banner(
                title="The Bridal Edit",
                subtitle="Rani haars, chandelier jhumkas and complete bridal sets for your big day.",
                cta_text="Shop Bridal",
                cta_link="/products?category=bridal-sets",
                placement="hero",
                position=1,
                bg_color="#A34A2F",
                text_color="#F8F4EC",
                image_url="https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1400&h=600&fit=crop&crop=center",
            ),
            Banner(
                title="Free Delivery Above ₹499 | Shop Now",
                cta_link="/products",
                placement="announcement",
                position=0,
                bg_color="#0E4D3A",
                text_color="#F8F4EC",
            ),
            Banner(
                title="Gift Boxes From ₹1,999",
                cta_link="/products?tags=bundle",
                placement="announcement",
                position=1,
                bg_color="#0A3B2C",
                text_color="#F8F4EC",
            ),
            Banner(
                title="Express Delivery Available",
                cta_link="/products",
                placement="announcement",
                position=2,
                bg_color="#0E4D3A",
                text_color="#F8F4EC",
            ),
            Banner(
                title="Adorn Yourself, Adorn Your Story.",
                cta_link="/products",
                placement="page",
                position=0,
                bg_color="#F1E9DC",
                text_color="#0E4D3A",
                image_url="/page-banner-default.jpeg",
            ),
        ]
        db.add_all(banners_seed)

        await db.commit()
        print(
            f"\nSeeded 1 admin, {len(CATEGORIES)} categories, "
            f"{len(PRODUCTS)} products, {len(BLOG_POSTS)} blog posts, "
            f"and {len(banners_seed)} banners."
        )


if __name__ == "__main__":
    asyncio.run(seed())
