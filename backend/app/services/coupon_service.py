from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Coupon, CouponType


def _compute_discount(coupon: Coupon, subtotal: float) -> float:
    if coupon.discount_type == CouponType.PERCENT:
        discount = subtotal * coupon.value / 100.0
    else:
        discount = float(coupon.value)

    if coupon.max_discount_amount is not None:
        discount = min(discount, float(coupon.max_discount_amount))

    return round(min(discount, subtotal), 2)


async def validate_coupon(db: AsyncSession, code: str, subtotal: float) -> tuple[Coupon, float]:
    """Return (coupon, discount) if valid, otherwise raise ValueError with a message."""
    result = await db.execute(
        select(Coupon).where(func.upper(Coupon.code) == code.strip().upper())
    )
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise ValueError("Invalid coupon code")

    now = datetime.now(timezone.utc)
    if not coupon.is_active:
        raise ValueError("This coupon is no longer active")
    if coupon.valid_from and coupon.valid_from.replace(tzinfo=timezone.utc) > now:
        raise ValueError("This coupon is not active yet")
    if coupon.valid_until and coupon.valid_until.replace(tzinfo=timezone.utc) < now:
        raise ValueError("This coupon has expired")
    if subtotal < coupon.min_order_amount:
        raise ValueError(
            f"Order subtotal must be at least ₹{coupon.min_order_amount:,.0f} to use this coupon"
        )
    if coupon.usage_limit is not None and coupon.times_used >= coupon.usage_limit:
        raise ValueError("This coupon has reached its usage limit")

    return coupon, _compute_discount(coupon, subtotal)


async def apply_coupon(db: AsyncSession, code: str, subtotal: float) -> tuple[str, float]:
    """Validate and redeem a coupon during checkout. Returns (code, discount)."""
    coupon, discount = await validate_coupon(db, code, subtotal)
    coupon.times_used += 1
    await db.flush()
    return coupon.code, discount


async def list_coupons(db: AsyncSession) -> list[Coupon]:
    result = await db.execute(select(Coupon).order_by(Coupon.created_at.desc()))
    return list(result.scalars().all())


async def create_coupon(db: AsyncSession, data: dict) -> Coupon:
    data = dict(data)
    data["code"] = data["code"].strip().upper()
    coupon = Coupon(**data)
    db.add(coupon)
    await db.flush()
    return coupon


async def update_coupon(db: AsyncSession, coupon_id: int, data: dict) -> Coupon | None:
    coupon = await db.get(Coupon, coupon_id)
    if not coupon:
        return None
    data = dict(data)
    if "code" in data and data["code"] is not None:
        data["code"] = data["code"].strip().upper()
    for field, value in data.items():
        if value is not None:
            setattr(coupon, field, value)
    await db.flush()
    return coupon


async def delete_coupon(db: AsyncSession, coupon_id: int) -> bool:
    coupon = await db.get(Coupon, coupon_id)
    if not coupon:
        return False
    await db.delete(coupon)
    await db.flush()
    return True


async def toggle_coupon(db: AsyncSession, coupon_id: int) -> Coupon | None:
    coupon = await db.get(Coupon, coupon_id)
    if not coupon:
        return None
    coupon.is_active = not coupon.is_active
    await db.flush()
    return coupon
