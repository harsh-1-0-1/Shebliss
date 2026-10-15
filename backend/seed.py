"""Minimal dev seed for Shebliss.

Creates:
  4 parent categories, each with 3 subcategories  (Unsplash images)
  3 products per subcategory  (48 products total)
  1 admin user + 1 regular user
  2 testimonials

Run from the backend/ directory:
    source .venv/bin/activate
    python seed.py

Safe to re-run — existing rows are skipped (slug/email uniqueness).
Pass --reset to wipe products, categories and users first.
"""

import asyncio
import os
import sys
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.db.models import Category, Product, Testimonial, User

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
# Data definitions  — NOTHING is hardcoded with raw IDs.
# Subcategories reference their parent by slug.
# ---------------------------------------------------------------------------

#  structure:
#  [
#    { parent_slug, parent_name, image_url, subcategories: [
#        { slug, name, image_url }
#    ]}
#  ]
CATEGORY_TREE = [
    {
        "slug": "necklace-sets",
        "name": "Necklace Sets",
        "image_url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop&q=80",
        "sort_order": 1,
        "subcategories": [
            {
                "slug": "kundan-necklace-sets",
                "name": "Kundan Necklace Sets",
                "image_url": "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop&q=80",
                "sort_order": 1,
            },
            {
                "slug": "choker-sets",
                "name": "Choker Sets",
                "image_url": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop&q=80",
                "sort_order": 2,
            },
            {
                "slug": "long-sets",
                "name": "Long Sets",
                "image_url": "https://images.unsplash.com/photo-1601121141461-9d6647bef0a1?w=400&h=400&fit=crop&q=80",
                "sort_order": 3,
            },
        ],
    },
    {
        "slug": "earrings",
        "name": "Earrings",
        "image_url": "https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=400&h=400&fit=crop&q=80",
        "sort_order": 2,
        "subcategories": [
            {
                "slug": "jhumkas",
                "name": "Jhumkas",
                "image_url": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop&q=80",
                "sort_order": 1,
            },
            {
                "slug": "chandbalis",
                "name": "Chandbalis",
                "image_url": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop&q=80",
                "sort_order": 2,
            },
            {
                "slug": "studs",
                "name": "Studs",
                "image_url": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop&q=80",
                "sort_order": 3,
            },
        ],
    },
    {
        "slug": "bangles",
        "name": "Bangles",
        "image_url": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop&q=80",
        "sort_order": 3,
        "subcategories": [
            {
                "slug": "kada",
                "name": "Kada",
                "image_url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop&q=80",
                "sort_order": 1,
            },
            {
                "slug": "bangle-set-4",
                "name": "Set of 4 Bangles",
                "image_url": "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop&q=80",
                "sort_order": 2,
            },
            {
                "slug": "bracelet",
                "name": "Bracelet",
                "image_url": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop&q=80",
                "sort_order": 3,
            },
        ],
    },
    {
        "slug": "wedding-jewellery",
        "name": "Wedding Jewellery",
        "image_url": "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop&q=80",
        "sort_order": 4,
        "subcategories": [
            {
                "slug": "bridal-sets",
                "name": "Bridal Sets",
                "image_url": "https://images.unsplash.com/photo-1601121141461-9d6647bef0a1?w=400&h=400&fit=crop&q=80",
                "sort_order": 1,
            },
            {
                "slug": "mang-tikka",
                "name": "Mang Tikka",
                "image_url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop&q=80",
                "sort_order": 2,
            },
            {
                "slug": "waist-belt",
                "name": "Waist Belt",
                "image_url": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop&q=80",
                "sort_order": 3,
            },
        ],
    },
]

# 3 products per subcategory — keyed by subcategory slug
# each entry is a list of (name, price, original_price, tags, color_hex)
PRODUCTS: dict[str, list[dict]] = {
    "kundan-necklace-sets": [
        {"name": "Kundan Royal Choker Set", "price": 1499, "original_price": 1999, "tags": ["kundan", "bestseller", "bridal"], "color_hex": "#046c48"},
        {"name": "Heritage Kundan Layered Set", "price": 1899, "original_price": 2499, "tags": ["kundan", "festive"], "color_hex": "#c2185b"},
        {"name": "Kundan Emerald Necklace", "price": 2199, "original_price": 2999, "tags": ["kundan", "bridal", "new-arrival"], "color_hex": "#046c48"},
    ],
    "choker-sets": [
        {"name": "Gold Plated Choker Set", "price": 999, "original_price": 1499, "tags": ["18k-gold", "bestseller"], "color_hex": "#ffd700"},
        {"name": "Antique Choker with Earrings", "price": 1299, "original_price": 1799, "tags": ["antique", "festive"], "color_hex": "#722f37"},
        {"name": "Minimalist AD Choker", "price": 799, "original_price": 1099, "tags": ["everyday", "new-arrival"], "color_hex": "#c0c0c0"},
    ],
    "long-sets": [
        {"name": "Temple Long Haaram Set", "price": 2499, "original_price": 3299, "tags": ["temple", "bridal"], "color_hex": "#ffd700"},
        {"name": "Polki Long Necklace Set", "price": 1999, "original_price": 2699, "tags": ["polki", "festive"], "color_hex": "#046c48"},
        {"name": "South Indian Long Chain Set", "price": 1749, "original_price": 2299, "tags": ["temple", "traditional"], "color_hex": "#ffd700"},
    ],
    "jhumkas": [
        {"name": "Classic Kundan Jhumkas", "price": 599, "original_price": 899, "tags": ["kundan", "bestseller"], "color_hex": "#ffd700"},
        {"name": "Rani Pink Chandbali Jhumkas", "price": 699, "original_price": 999, "tags": ["festive", "new-arrival"], "color_hex": "#c2185b"},
        {"name": "Emerald Drop Jhumkas", "price": 799, "original_price": 1099, "tags": ["everyday", "bridal"], "color_hex": "#046c48"},
    ],
    "chandbalis": [
        {"name": "Antique Gold Chandbali", "price": 899, "original_price": 1199, "tags": ["antique", "bridal"], "color_hex": "#ffd700"},
        {"name": "Ruby Red Chandbali Earrings", "price": 749, "original_price": 999, "tags": ["festive", "bestseller"], "color_hex": "#9b111e"},
        {"name": "Peacock Enamel Chandbali", "price": 949, "original_price": 1299, "tags": ["festive", "new-arrival"], "color_hex": "#009B77"},
    ],
    "studs": [
        {"name": "Pearl Drop Studs", "price": 349, "original_price": 499, "tags": ["everyday", "minimal"], "color_hex": "#f0ead6"},
        {"name": "AD Flower Studs", "price": 299, "original_price": 449, "tags": ["everyday", "bestseller"], "color_hex": "#c0c0c0"},
        {"name": "Gold Plated Ball Studs", "price": 249, "original_price": 399, "tags": ["everyday", "minimal"], "color_hex": "#ffd700"},
    ],
    "kada": [
        {"name": "Antique Copper Finish Kada", "price": 799, "original_price": 1099, "tags": ["antique", "traditional"], "color_hex": "#722f37"},
        {"name": "Kundan Studded Kada", "price": 999, "original_price": 1399, "tags": ["kundan", "bridal"], "color_hex": "#ffd700"},
        {"name": "Simple Gold Plated Kada", "price": 599, "original_price": 849, "tags": ["everyday", "18k-gold"], "color_hex": "#ffd700"},
    ],
    "bangle-set-4": [
        {"name": "Kundan Stone Set of 4", "price": 849, "original_price": 1199, "tags": ["kundan", "festive", "bestseller"], "color_hex": "#046c48"},
        {"name": "Multicolor Enamel Bangles x4", "price": 699, "original_price": 999, "tags": ["festive", "new-arrival"], "color_hex": None},
        {"name": "Gold Polish Bangles Set of 4", "price": 749, "original_price": 999, "tags": ["18k-gold", "everyday"], "color_hex": "#ffd700"},
    ],
    "bracelet": [
        {"name": "Oxidised Silver Charm Bracelet", "price": 499, "original_price": 699, "tags": ["everyday", "minimal"], "color_hex": "#c0c0c0"},
        {"name": "Kundan Bracelet with Beads", "price": 649, "original_price": 899, "tags": ["kundan", "festive"], "color_hex": "#ffd700"},
        {"name": "AD Tennis Bracelet", "price": 549, "original_price": 799, "tags": ["everyday", "bestseller"], "color_hex": "#c0c0c0"},
    ],
    "bridal-sets": [
        {"name": "Full Bridal Kundan Set", "price": 4999, "original_price": 6999, "tags": ["kundan", "bridal", "bestseller"], "color_hex": "#ffd700"},
        {"name": "South Indian Bridal 7-Piece Set", "price": 5499, "original_price": 7499, "tags": ["temple", "bridal"], "color_hex": "#ffd700"},
        {"name": "Polki Bridal Set with Tikka", "price": 4499, "original_price": 5999, "tags": ["polki", "bridal", "new-arrival"], "color_hex": "#046c48"},
    ],
    "mang-tikka": [
        {"name": "Kundan Maang Tikka", "price": 799, "original_price": 1099, "tags": ["kundan", "bridal"], "color_hex": "#ffd700"},
        {"name": "Pearl Maang Tikka", "price": 599, "original_price": 849, "tags": ["bridal", "everyday"], "color_hex": "#f0ead6"},
        {"name": "Emerald Maang Tikka", "price": 999, "original_price": 1399, "tags": ["bridal", "festive"], "color_hex": "#046c48"},
    ],
    "waist-belt": [
        {"name": "Bridal Kamarband Gold", "price": 1499, "original_price": 2099, "tags": ["bridal", "temple"], "color_hex": "#ffd700"},
        {"name": "Kundan Waist Belt", "price": 1299, "original_price": 1799, "tags": ["kundan", "bridal"], "color_hex": "#046c48"},
        {"name": "Antique Saree Waist Belt", "price": 1099, "original_price": 1499, "tags": ["antique", "traditional"], "color_hex": "#ffd700"},
    ],
}

# A few Unsplash product image URLs reused across products
_PRODUCT_IMAGES = [
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=600&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=800&fit=crop&q=80",
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


# ---------------------------------------------------------------------------
# Seed logic
# ---------------------------------------------------------------------------

async def seed(reset: bool = False) -> None:
    async with Session() as db:
        if reset:
            print("⚠  Resetting products, categories, users, testimonials …")
            await db.execute(text("DELETE FROM testimonials"))
            await db.execute(text("DELETE FROM product_reviews"))
            await db.execute(text("DELETE FROM cart_items"))
            await db.execute(text("DELETE FROM order_items"))
            await db.execute(text("DELETE FROM products"))
            await db.execute(text("DELETE FROM categories"))
            await db.execute(text("DELETE FROM users"))
            await db.commit()

        # ------------------------------------------------------------------
        # 1. Users
        # ------------------------------------------------------------------
        for u in USERS:
            exists = await db.execute(
                text("SELECT id FROM users WHERE email = :e"), {"e": u["email"]}
            )
            if exists.scalar_one_or_none():
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

        # ------------------------------------------------------------------
        # 2. Categories (parents first, then children)
        # ------------------------------------------------------------------
        # slug → Category ORM object (populated after insert)
        cat_map: dict[str, Category] = {}

        for parent_def in CATEGORY_TREE:
            row = await db.execute(
                text("SELECT id FROM categories WHERE slug = :s"), {"s": parent_def["slug"]}
            )
            existing_id = row.scalar_one_or_none()
            if existing_id:
                print(f"  skip cat   {parent_def['slug']}")
                row2 = await db.execute(
                    text("SELECT * FROM categories WHERE id = :i"), {"i": existing_id}
                )
                # just record the id so children can reference it
                cat_map[parent_def["slug"]] = existing_id  # type: ignore[assignment]
            else:
                parent_cat = Category(
                    name=parent_def["name"],
                    slug=parent_def["slug"],
                    image_url=parent_def["image_url"],
                    sort_order=parent_def["sort_order"],
                    is_active=True,
                )
                db.add(parent_cat)
                await db.flush()   # get the id
                cat_map[parent_def["slug"]] = parent_cat
                print(f"  + cat      {parent_def['slug']}")

            parent_id = (
                cat_map[parent_def["slug"]].id  # type: ignore[union-attr]
                if not isinstance(cat_map[parent_def["slug"]], int)
                else cat_map[parent_def["slug"]]
            )

            for sub_def in parent_def["subcategories"]:
                row = await db.execute(
                    text("SELECT id FROM categories WHERE slug = :s"), {"s": sub_def["slug"]}
                )
                if row.scalar_one_or_none():
                    print(f"  skip cat   {sub_def['slug']}")
                    continue
                sub_cat = Category(
                    name=sub_def["name"],
                    slug=sub_def["slug"],
                    image_url=sub_def["image_url"],
                    sort_order=sub_def["sort_order"],
                    parent_id=parent_id,
                    is_active=True,
                )
                db.add(sub_cat)
                await db.flush()
                cat_map[sub_def["slug"]] = sub_cat
                print(f"  + cat      {sub_def['slug']}  (child of {parent_def['slug']})")

        await db.commit()

        # ------------------------------------------------------------------
        # 3. Products
        # ------------------------------------------------------------------
        img_counter = 0
        for sub_slug, product_list in PRODUCTS.items():
            # look up the subcategory id
            row = await db.execute(
                text("SELECT id FROM categories WHERE slug = :s"), {"s": sub_slug}
            )
            cat_id = row.scalar_one_or_none()
            if not cat_id:
                print(f"  WARN: subcategory '{sub_slug}' not found, skipping its products")
                continue

            for p in product_list:
                slug = _slugify(p["name"])
                row = await db.execute(
                    text("SELECT id FROM products WHERE slug = :s"), {"s": slug}
                )
                if row.scalar_one_or_none():
                    print(f"  skip prod  {slug}")
                    img_counter += 1
                    continue

                db.add(Product(
                    name=p["name"],
                    slug=slug,
                    description=f"Beautiful {p['name'].lower()} — handcrafted with premium artificial jewellery.",
                    price=float(p["price"]),
                    original_price=float(p["original_price"]),
                    stock_qty=20,
                    category_id=cat_id,
                    images=[_pick_image(img_counter), _pick_image(img_counter + 1)],
                    tags=p["tags"],
                    is_active=True,
                    variants=_build_variants(p.get("color_hex")),
                ))
                print(f"  + product  {slug}")
                img_counter += 1

        await db.commit()

        # ------------------------------------------------------------------
        # 4. Testimonials
        # ------------------------------------------------------------------
        for t in TESTIMONIALS:
            row = await db.execute(
                text("SELECT id FROM testimonials WHERE name = :n AND quote = :q"),
                {"n": t["name"], "q": t["quote"]},
            )
            if row.scalar_one_or_none():
                print(f"  skip test  {t['name']}")
                continue
            db.add(Testimonial(**t))
            print(f"  + test     {t['name']}")

        await db.commit()

    print("\n✅  Seed complete.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    reset_flag = "--reset" in sys.argv
    asyncio.run(seed(reset=reset_flag))
