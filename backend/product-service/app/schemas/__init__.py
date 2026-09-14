"""
AURON Product Service Schemas.

Pydantic schemas used for request validation
and API responses.
"""

from .product import ProductCreate, ProductResponse

__version__ = "0.1.0"

__all__ = [
    "ProductCreate",
    "ProductResponse",
]
