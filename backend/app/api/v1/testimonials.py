from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_admin
from app.db.models import Testimonial
from app.db.session import get_db
from app.schemas.testimonial import TestimonialOut
from app.utils.image_upload import delete_image_file, upload_image_file

router = APIRouter(prefix="/testimonials", tags=["testimonials"])


def _apply_updates(testimonial: Testimonial, form: dict) -> None:
    for field, value in form.items():
        if value is not None:
            setattr(testimonial, field, value)


# ── PUBLIC ──────────────────────────────────────────────────────────────────


@router.get("", response_model=list[TestimonialOut])
async def get_active_testimonials(
    limit: int = 6,
    featured_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Testimonial)
        .where(Testimonial.is_active == True)  # noqa: E712
        .order_by(Testimonial.sort_order.asc(), Testimonial.id.asc())
        .limit(max(1, min(limit, 20)))
    )
    if featured_only:
        stmt = stmt.where(Testimonial.is_featured == True)  # noqa: E712
    result = await db.execute(stmt)
    return result.scalars().all()


# ── ADMIN ───────────────────────────────────────────────────────────────────


@router.get("/admin", response_model=list[TestimonialOut])
async def admin_list_testimonials(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    stmt = select(Testimonial).order_by(Testimonial.sort_order.asc(), Testimonial.id.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/admin", response_model=TestimonialOut)
async def create_testimonial(
    name: str = Form(...),
    quote: str = Form(...),
    rating: int = Form(5),
    item_purchased: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    is_verified: bool = Form(True),
    is_featured: bool = Form(True),
    is_active: bool = Form(True),
    sort_order: int = Form(0),
    avatar: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    if not (1 <= rating <= 5):
        raise HTTPException(422, "Rating must be between 1 and 5")

    testimonial = Testimonial(
        name=name,
        rating=rating,
        quote=quote,
        item_purchased=item_purchased,
        location=location,
        is_verified=is_verified,
        is_featured=is_featured,
        is_active=is_active,
        sort_order=sort_order,
    )
    db.add(testimonial)
    await db.flush()

    if avatar and avatar.filename:
        key = await upload_image_file(avatar, folder="testimonials", entity_id=testimonial.id)
        testimonial.avatar_url = key
        await db.flush()

    await db.refresh(testimonial)
    logger.info("Testimonial created id={}", testimonial.id)
    return testimonial


@router.put("/admin/{testimonial_id}", response_model=TestimonialOut)
async def update_testimonial(
    testimonial_id: int,
    name: Optional[str] = Form(None),
    quote: Optional[str] = Form(None),
    rating: Optional[int] = Form(None),
    item_purchased: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    is_verified: Optional[bool] = Form(None),
    is_featured: Optional[bool] = Form(None),
    is_active: Optional[bool] = Form(None),
    sort_order: Optional[int] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    testimonial = await db.get(Testimonial, testimonial_id)
    if not testimonial:
        raise HTTPException(404, "Testimonial not found")

    if rating is not None and not (1 <= rating <= 5):
        raise HTTPException(422, "Rating must be between 1 and 5")

    if avatar and avatar.filename:
        old_key = testimonial.avatar_url
        key = await upload_image_file(avatar, folder="testimonials", entity_id=testimonial.id)
        testimonial.avatar_url = key
        if old_key and old_key != key:
            await delete_image_file(old_key)

    _apply_updates(testimonial, {
        "name": name,
        "quote": quote,
        "rating": rating,
        "item_purchased": item_purchased,
        "location": location,
        "is_verified": is_verified,
        "is_featured": is_featured,
        "is_active": is_active,
        "sort_order": sort_order,
    })

    await db.flush()
    await db.refresh(testimonial)
    return testimonial


@router.delete("/admin/{testimonial_id}")
async def delete_testimonial(
    testimonial_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    testimonial = await db.get(Testimonial, testimonial_id)
    if not testimonial:
        raise HTTPException(404, "Testimonial not found")
    if testimonial.avatar_url:
        await delete_image_file(testimonial.avatar_url)
    await db.delete(testimonial)
    await db.flush()
    logger.info("Testimonial deleted id={}", testimonial_id)
    return {"ok": True}


@router.patch("/admin/{testimonial_id}/toggle", response_model=TestimonialOut)
async def toggle_testimonial(
    testimonial_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    testimonial = await db.get(Testimonial, testimonial_id)
    if not testimonial:
        raise HTTPException(404, "Testimonial not found")
    testimonial.is_active = not testimonial.is_active
    await db.flush()
    await db.refresh(testimonial)
    return testimonial