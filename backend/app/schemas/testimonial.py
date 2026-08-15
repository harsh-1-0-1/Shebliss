from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_serializer

from app.utils.image_upload import resolve_image_url


class TestimonialBase(BaseModel):
    name: str = Field(..., max_length=255)
    rating: int = Field(5, ge=1, le=5)
    quote: str = Field(..., max_length=2000)
    item_purchased: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=120)
    is_verified: bool = True
    is_featured: bool = True
    is_active: bool = True
    sort_order: int = 0

    model_config = {"from_attributes": True}


class TestimonialCreate(TestimonialBase):
    pass


class TestimonialUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    rating: Optional[int] = Field(None, ge=1, le=5)
    quote: Optional[str] = Field(None, max_length=2000)
    item_purchased: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=120)
    is_verified: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class TestimonialOut(TestimonialBase):
    id: int
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

    @field_serializer("avatar_url")
    def serialize_avatar_url(self, val: Optional[str]) -> Optional[str]:
        return resolve_image_url(val) if val else None