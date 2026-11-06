from datetime import time

from sqlalchemy import Float, ForeignKey, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)  # R-01
    name: Mapped[str] = mapped_column(String(120))
    zone: Mapped[str] = mapped_column(String(80), index=True)  # ward / area
    is_active: Mapped[bool] = mapped_column(default=True)
    is_demo: Mapped[bool] = mapped_column(default=False)

    stops: Mapped[list["RouteStop"]] = relationship(
        back_populates="route",
        order_by="RouteStop.sequence",
        cascade="all, delete-orphan",
    )


class RouteStop(Base):
    __tablename__ = "route_stops"
    __table_args__ = (UniqueConstraint("route_id", "sequence", name="uq_stop_route_seq"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id"), index=True)
    sequence: Mapped[int]
    name: Mapped[str] = mapped_column(String(160))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    expected_time: Mapped[time | None] = mapped_column(Time, nullable=True)

    route: Mapped[Route] = relationship(back_populates="stops")
