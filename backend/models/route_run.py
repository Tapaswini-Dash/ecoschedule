from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, ForeignKey, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.enums import RunStatus, StopStatus
from db.base import Base
from models._types import enum_col


class RouteRun(Base):
    """A route executed on a given date."""

    __tablename__ = "route_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id"), index=True)
    vehicle_id: Mapped[int | None] = mapped_column(ForeignKey("vehicles.id"), nullable=True)
    collector_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    run_date: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[RunStatus] = mapped_column(enum_col(RunStatus), default=RunStatus.NOT_STARTED)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delay_minutes: Mapped[int] = mapped_column(default=0)
    delay_reason: Mapped[str | None] = mapped_column(String(300), nullable=True)
    delay_revised_time: Mapped[time | None] = mapped_column(Time, nullable=True)

    visits: Mapped[list["StopVisit"]] = relationship(
        back_populates="run", cascade="all, delete-orphan", order_by="StopVisit.id"
    )


class StopVisit(Base):
    __tablename__ = "stop_visits"
    __table_args__ = (UniqueConstraint("run_id", "stop_id", name="uq_visit_run_stop"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("route_runs.id"), index=True)
    stop_id: Mapped[int] = mapped_column(ForeignKey("route_stops.id"))
    status: Mapped[StopStatus] = mapped_column(enum_col(StopStatus), default=StopStatus.PENDING)
    visited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    note: Mapped[str | None] = mapped_column(String(300), nullable=True)

    run: Mapped[RouteRun] = relationship(back_populates="visits")
    stop = relationship("RouteStop")

    @property
    def stop_name(self) -> str:
        return self.stop.name

    @property
    def sequence(self) -> int:
        return self.stop.sequence
