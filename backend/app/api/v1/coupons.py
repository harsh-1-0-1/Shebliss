from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_admin
from app.db.models import User
from app.db.session import get_db
from app.schemas.coupon import (
    CouponCreate,
    CouponOut,
    CouponUpdate,
    CouponValidateRequest,
    CouponValidateResponse,
)
from app.services import coupon_service

public_router = APIRouter(prefix="/coupons", tags=["coupons"])
admin_router = APIRouter(prefix="/admin/coupons", tags=["admin-coupons"])


@public_router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(
    body: CouponValidateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint: check a coupon code against a cart subtotal (no redemption)."""
    try:
        _, discount = await coupon_service.validate_coupon(db, body.code, body.subtotal)
    except ValueError as exc:
        return CouponValidateResponse(valid=False, code=body.code, discount=0, message=str(exc))
    return CouponValidateResponse(
        valid=True, code=body.code.upper(), discount=discount, message="Coupon applied"
    )


@admin_router.get("", response_model=list[CouponOut])
async def admin_list_coupons(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await coupon_service.list_coupons(db)


@admin_router.post("", response_model=CouponOut, status_code=201)
async def admin_create_coupon(
    body: CouponCreate,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await coupon_service.create_coupon(db, body.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not create coupon: {exc}")


@admin_router.put("/{coupon_id}", response_model=CouponOut)
async def admin_update_coupon(
    coupon_id: int,
    body: CouponUpdate,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    coupon = await coupon_service.update_coupon(db, coupon_id, body.model_dump(exclude_unset=True))
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon


@admin_router.delete("/{coupon_id}")
async def admin_delete_coupon(
    coupon_id: int,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    deleted = await coupon_service.delete_coupon(db, coupon_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"ok": True}


@admin_router.patch("/{coupon_id}/toggle", response_model=CouponOut)
async def admin_toggle_coupon(
    coupon_id: int,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    coupon = await coupon_service.toggle_coupon(db, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon
