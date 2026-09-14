"""
AURON Product Service Schemas.

Pydantic schemas used for request validation
and API responses.
"""

from .product import ProductCreate, ProductResponse

__all__ = [
    "ProductCreate",
    "ProductResponse",
]
