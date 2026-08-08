import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_admin
from app.db.models import InquiryStatus, User
from app.db.session import get_db
from app.schemas.corporate_inquiry import (
    CorporateInquiryCreate,
    CorporateInquiryListResponse,
    CorporateInquiryOut,
    CorporateInquiryStatusUpdate,
)
from app.services import corporate_inquiry_service

router = APIRouter(prefix="/corporate-inquiries", tags=["corporate-inquiries"])


@router.post("", response_model=CorporateInquiryOut, status_code=201)
async def submit_inquiry(
    body: CorporateInquiryCreate,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint: customers submitting the corporate gifting form."""
    inquiry = await corporate_inquiry_service.create_inquiry(
        db, **body.model_dump()
    )
    return inquiry


@router.get("/admin", response_model=CorporateInquiryListResponse)
async def admin_list_inquiries(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    inquiries, total = await corporate_inquiry_service.list_inquiries(
        db, page=page, limit=limit, status=status
    )
    pages = math.ceil(total / limit) if total else 0
    return CorporateInquiryListResponse(
        items=[CorporateInquiryOut.model_validate(i) for i in inquiries],
        total=total,
        page=page,
        pages=pages,
    )


@router.patch("/admin/{inquiry_id}/status", response_model=CorporateInquiryOut)
async def admin_update_inquiry_status(
    inquiry_id: int,
    body: CorporateInquiryStatusUpdate,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        InquiryStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid status: {body.status}")

    inquiry = await corporate_inquiry_service.update_inquiry_status(
        db, inquiry_id, body.status
    )
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return inquiry
