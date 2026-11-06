from datetime import date, time

from sqlalchemy import JSON, Date, ForeignKey, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.enums import OverrideKind
from db.base import Base
from models._types import enum_col


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id"), index=True)
    days_of_week: Mapped[list[int]] = mapped_column(JSON)  # Mon=0 ... Sun=6
    window_start: Mapped[time] = mapped_column(Time)
    window_end: Mapped[time] = mapped_column(Time)
    # Configurable category code (wet / dry / special / anything the city defines).
    waste_type: Mapped[str] = mapped_column(String(30), index=True)
    valid_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    valid_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    is_demo: Mapped[bool] = mapped_column(default=False)

    route = relationship("Route")
    overrides: Mapped[list["ScheduleOverride"]] = relationship(
        back_populates="schedule", cascade="all, delete-orphan"
    )

    @property
    def route_code(self) -> str:
        return self.route.code

    @property
    def zone(self) -> str:
        return self.route.zone


class ScheduleOverride(Base):
    """Holiday / one-off change for a schedule on a specific date."""

    __tablename__ = "schedule_overrides"
    __table_args__ = (UniqueConstraint("schedule_id", "on_date", name="uq_override_sched_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    schedule_id: Mapped[int] = mapped_column(ForeignKey("schedules.id"), index=True)
    on_date: Mapped[date] = mapped_column(Date)
    kind: Mapped[OverrideKind] = mapped_column(enum_col(OverrideKind))
    new_window_start: Mapped[time | None] = mapped_column(Time, nullable=True)
    new_window_end: Mapped[time | None] = mapped_column(Time, nullable=True)
    reason: Mapped[str] = mapped_column(String(200))

    schedule: Mapped[Schedule] = relationship(back_populates="overrides")
