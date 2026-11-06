from sqlalchemy import Boolean, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class WasteFacility(Base):
    __tablename__ = "waste_facilities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    facility_type: Mapped[str] = mapped_column(String(40), index=True)
    address: Mapped[str] = mapped_column(String(240))
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    capacity_tonnes: Mapped[float | None] = mapped_column(Float, nullable=True)
    contact: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)