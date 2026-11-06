from sqlalchemy import Boolean, Float, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class DisposalPoint(Base):
    __tablename__ = "disposal_points"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    address: Mapped[str] = mapped_column(String(240))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    accepted_waste_types: Mapped[list[str]] = mapped_column(JSON, default=list)
    opening_hours: Mapped[str | None] = mapped_column(String(120), nullable=True)
    contact: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)