from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


class CouponBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    discount_type: Literal["percent", "fixed"]
    value: float = Field(..., gt=0)
    min_order_amount: float = Field(0, ge=0)
    max_discount_amount: Optional[float] = Field(None, gt=0)
    usage_limit: Optional[int] = Field(None, ge=1)
    is_active: bool = True
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None

    @model_validator(mode="after")
    def _percent_value_must_be_under_100(self):
        if self.discount_type == "percent" and self.value > 100:
            raise ValueError("Percentage discount cannot exceed 100%")
        return self

    @model_validator(mode="after")
    def _dates_ordered(self):
        if self.valid_from and self.valid_until and self.valid_from > self.valid_until:
            raise ValueError("valid_from must be before valid_until")
        return self


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    discount_type: Optional[Literal["percent", "fixed"]] = None
    value: Optional[float] = Field(None, gt=0)
    min_order_amount: Optional[float] = Field(None, ge=0)
    max_discount_amount: Optional[float] = Field(None, gt=0)
    usage_limit: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None


class CouponOut(BaseModel):
    id: int
    code: str
    discount_type: str
    value: float
    min_order_amount: float
    max_discount_amount: Optional[float] = None
    usage_limit: Optional[int] = None
    times_used: int
    is_active: bool
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CouponValidateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    subtotal: float = Field(..., ge=0)


class CouponValidateResponse(BaseModel):
    valid: bool
    code: Optional[str] = None
    discount: float = 0
    message: str = ""
