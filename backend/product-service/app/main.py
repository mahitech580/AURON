"""
AURON Product Service.

Provides product catalog management APIs backed by PostgreSQL.
"""

from contextlib import asynccontextmanager
from typing import Generator

from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal, engine
from app.models.product import Base, Product
from app.schemas.product import ProductCreate, ProductResponse


# =========================================================
# Database Initialization
# =========================================================

def initialize_database() -> None:
    """
    Initialize database tables.

    This is suitable for the current development stage of AURON.
    Production deployments should eventually use Alembic migrations.
    """
    Base.metadata.create_all(bind=engine)


# =========================================================
# Application Lifecycle
# =========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage Product Service startup and shutdown lifecycle.
    """

    initialize_database()

    yield


# =========================================================
# FastAPI Application
# =========================================================

app = FastAPI(
    title=f"{settings.app_name} Product Service",
    version=settings.app_version,
    description=(
        "Product catalog service for the AURON "
        "commerce and fulfillment platform."
    ),
    lifespan=lifespan,
)


# =========================================================
# Database Dependency
# =========================================================

def get_db() -> Generator[Session, None, None]:
    """
    Provide a SQLAlchemy database session.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# Root Endpoint
# =========================================================

@app.get("/")
def root():
    """
    Product Service information endpoint.
    """

    return {
        "service": "auron-product-service",
        "version": settings.app_version,
        "environment": settings.app_env,
        "status": "running",
    }


# =========================================================
# Health Check
# =========================================================

@app.get("/api/products/health")
def health_check(
    db: Session = Depends(get_db),
):
    """
    Check Product Service and PostgreSQL connectivity.
    """

    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "service": "auron-product-service",
            "database": "connected",
        }

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "service": "auron-product-service",
                "database": "unavailable",
            },
        )


# =========================================================
# Create Product
# =========================================================

@app.post(
    "/api/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new product.
    """

    new_product = Product(
        **product.model_dump()
    )

    try:
        db.add(new_product)
        db.commit()
        db.refresh(new_product)

        return new_product

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create product",
        )


# =========================================================
# List Products
# =========================================================

@app.get(
    "/api/products",
    response_model=list[ProductResponse],
)
def get_products(
    skip: int = Query(
        default=0,
        ge=0,
        description="Number of products to skip.",
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Maximum number of products to return.",
    ),
    db: Session = Depends(get_db),
):
    """
    Return a paginated list of products.
    """

    return (
        db.query(Product)
        .order_by(Product.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


# =========================================================
# Get Product
# =========================================================

@app.get(
    "/api/products/{product_id}",
    response_model=ProductResponse,
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve a product by ID.
    """

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return product


# =========================================================
# Update Product
# =========================================================

@app.put(
    "/api/products/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    """
    Replace an existing product.
    """

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    update_data = product_data.model_dump()

    for field, value in update_data.items():
        setattr(product, field, value)

    try:
        db.commit()
        db.refresh(product)

        return product

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update product",
        )


# =========================================================
# Delete Product
# =========================================================

@app.delete(
    "/api/products/{product_id}",
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a product.
    """

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    try:
        db.delete(product)
        db.commit()

        return {
            "status": "success",
            "message": "Product deleted",
            "id": product_id,
        }

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete product",
        )
