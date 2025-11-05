from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base for declarative SQLAlchemy models."""


metadata = Base.metadata
