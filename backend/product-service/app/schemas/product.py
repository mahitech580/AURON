"""
AURON Product Service Schemas.

Pydantic schemas used for product creation,
validation, updates, and API responses.
"""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    """
    Schema for creating or updating a product.
    """

    name: str = Field(
        min_length=1,
        max_length=150,
    )

    description: str | None = None

    price: Decimal = Field(
        gt=0,
        max_digits=10,
        decimal_places=2,
    )

    category: str = Field(
        min_length=1,
        max_length=100,
    )

    stock: int = Field(
        ge=0,
    )


class ProductResponse(ProductCreate):
    """
    Schema returned by the Product Service.
    """

    id: int

    model_config = ConfigDict(
        from_attributes=True,
    )
