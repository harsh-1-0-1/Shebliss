from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class CorporateInquiryCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=7, max_length=20)
    email: EmailStr
    company_name: str = Field(..., min_length=2, max_length=255)
    customisation: Optional[str] = Field(None, max_length=2000)
    qty_requested: Optional[int] = Field(None, ge=1)


class CorporateInquiryStatusUpdate(BaseModel):
    status: str


class CorporateInquiryOut(BaseModel):
    id: int
    full_name: str
    phone: str
    email: str
    company_name: str
    customisation: Optional[str] = None
    qty_requested: Optional[int] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CorporateInquiryListResponse(BaseModel):
    items: list[CorporateInquiryOut]
    total: int
    page: int
    pages: int
