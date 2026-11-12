from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import OrderStatus
from app.utils import normalize_phone


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth ----------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminOut(ORM):
    id: int
    email: str


# ---------- Store ----------
class StoreIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    whatsapp: str = Field(min_length=8, max_length=20)
    description: str = ""
    address: str = ""

    @field_validator("whatsapp")
    @classmethod
    def _wa(cls, v: str) -> str:
        return normalize_phone(v)


class StoreOut(ORM):
    name: str
    whatsapp: str
    description: str
    address: str


# ---------- Category ----------
class CategoryIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)


class CategoryOut(ORM):
    id: int
    name: str
    slug: str


# ---------- Product ----------
class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str = ""
    price: int = Field(ge=0)
    stock: int = Field(ge=0)
    is_active: bool = True
    category_id: int | None = None


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = None
    price: int | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    category_id: int | None = None


class ProductImageOut(ORM):
    id: int
    url: str


class ProductOut(ORM):
    id: int
    name: str
    slug: str
    description: str
    price: int
    stock: int
    image_url: str | None
    is_active: bool
    category: CategoryOut | None
    images: list[ProductImageOut] = []
    created_at: datetime


class ProductPage(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    limit: int


# ---------- Order ----------
class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=999)


class OrderIn(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    customer_phone: str = Field(min_length=8, max_length=20)
    customer_address: str = Field(min_length=5, max_length=1000)
    note: str = Field(default="", max_length=1000)
    items: list[OrderItemIn] = Field(min_length=1, max_length=50)

    @field_validator("customer_phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalize_phone(v)


class OrderItemOut(ORM):
    product_id: int | None
    product_name: str
    price: int
    quantity: int
    subtotal: int


class OrderOut(ORM):
    id: int
    code: str
    customer_name: str
    customer_phone: str
    customer_address: str
    note: str
    total: int
    status: OrderStatus
    created_at: datetime
    items: list[OrderItemOut]


class OrderCreated(BaseModel):
    order: OrderOut
    whatsapp_url: str


class OrderStatusIn(BaseModel):
    status: OrderStatus


# ---------- Stats ----------
class TopProduct(BaseModel):
    product_name: str
    quantity: int


class LowStockProduct(ORM):
    id: int
    name: str
    slug: str
    stock: int
    image_url: str | None


class StatsOut(BaseModel):
    total_products: int
    active_products: int
    low_stock: int
    orders_by_status: dict[str, int]
    revenue: int
    top_products: list[TopProduct]
    low_stock_products: list[LowStockProduct] = []
