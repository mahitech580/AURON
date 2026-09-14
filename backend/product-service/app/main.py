from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.models.product import Base, Product
from app.schemas.product import ProductCreate, ProductResponse


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AURON Product Service",
    version="0.1.0",
    description="Product catalog service for the AURON commerce platform.",
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@app.get("/api/products/health")
def health_check():
    return {
        "status": "ok",
        "service": "auron-product-service",
        "database": "connected",
    }


@app.post(
    "/api/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    new_product = Product(**product.model_dump())

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@app.get(
    "/api/products",
    response_model=list[ProductResponse],
)
def get_products(
    db: Session = Depends(get_db),
):
    return (
        db.query(Product)
        .order_by(Product.id)
        .all()
    )


@app.get(
    "/api/products/{product_id}",
    response_model=ProductResponse,
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
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


@app.put(
    "/api/products/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
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

    for field, value in product_data.model_dump().items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product


@app.delete("/api/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
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

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted",
        "id": product_id,
    }
