from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import CorporateInquiry, InquiryStatus


async def create_inquiry(
    db: AsyncSession,
    *,
    full_name: str,
    phone: str,
    email: str,
    company_name: str,
    customisation: str | None = None,
    qty_requested: int | None = None,
) -> CorporateInquiry:
    inquiry = CorporateInquiry(
        full_name=full_name,
        phone=phone,
        email=email,
        company_name=company_name,
        customisation=customisation,
        qty_requested=qty_requested,
        status=InquiryStatus.NEW,
    )
    db.add(inquiry)
    await db.flush()
    return inquiry


async def list_inquiries(
    db: AsyncSession,
    page: int = 1,
    limit: int = 20,
    status: str | None = None,
) -> tuple[list[CorporateInquiry], int]:
    q = select(CorporateInquiry)
    count_q = select(func.count()).select_from(CorporateInquiry)

    if status:
        try:
            os = InquiryStatus(status)
        except ValueError:
            os = None
        if os:
            q = q.where(CorporateInquiry.status == os)
            count_q = count_q.where(CorporateInquiry.status == os)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * limit
    result = await db.execute(
        q.order_by(CorporateInquiry.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all()), total


async def update_inquiry_status(
    db: AsyncSession,
    inquiry_id: int,
    status: str,
) -> CorporateInquiry | None:
    result = await db.execute(
        select(CorporateInquiry).where(CorporateInquiry.id == inquiry_id)
    )
    inquiry = result.scalar_one_or_none()
    if not inquiry:
        return None
    inquiry.status = InquiryStatus(status)
    await db.flush()
    return inquiry
