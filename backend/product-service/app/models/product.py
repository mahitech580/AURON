from sqlalchemy import Column, Integer, String, Text, Numeric
from sqlalchemy.orm import declarative_base


Base = declarative_base()


class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
        index=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    price = Column(
        Numeric(10, 2),
        nullable=False,
    )

    category = Column(
        String(100),
        nullable=False,
        index=True,
    )

    stock = Column(
        Integer,
        nullable=False,
        default=0,
    )
