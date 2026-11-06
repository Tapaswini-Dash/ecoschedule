from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from core.enums import LocationSource, VehicleStatus
from db.base import Base
from models._types import enum_col


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)
    registration: Mapped[str] = mapped_column(String(30), unique=True, index=True)  # TRK-101
    type: Mapped[str] = mapped_column(String(40))
    status: Mapped[VehicleStatus] = mapped_column(
        enum_col(VehicleStatus), default=VehicleStatus.ACTIVE
    )
    assigned_route_id: Mapped[int | None] = mapped_column(ForeignKey("routes.id"), nullable=True)
    is_demo: Mapped[bool] = mapped_column(default=False)


class VehicleLocation(Base):
    __tablename__ = "vehicle_locations"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), index=True)
    run_id: Mapped[int | None] = mapped_column(ForeignKey("route_runs.id"), nullable=True, index=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    # Always set by the server, never trusted from the client.
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    source: Mapped[LocationSource] = mapped_column(enum_col(LocationSource))
    recorded_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    is_demo: Mapped[bool] = mapped_column(default=False)
