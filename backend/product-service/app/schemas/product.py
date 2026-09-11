from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    price: Decimal = Field(gt=0)
    category: str = Field(min_length=1, max_length=100)
    stock: int = Field(ge=0)


class ProductResponse(ProductCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
