"""
AURON Product Service Routes

This package contains the HTTP route definitions
used by the Product Service.
"""

from .products import router as product_router

__all__ = ["product_router"]
