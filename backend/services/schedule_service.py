from datetime import date

from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from core.enums import OverrideKind
from models.route import Route
from models.schedule import Schedule, ScheduleOverride
from schemas.schedule import OverrideCreate, ScheduleCreate, ScheduleUpdate
from services._db import apply_updates, commit_or_409


def list_schedules(db: Session, zone: str | None, route_id: int | None, active_only: bool = True):
    q = select(Schedule).join(Route, Route.id == Schedule.route_id).order_by(Route.code, Schedule.window_start)
    if zone:
        q = q.where(Route.zone.ilike(zone))
    if route_id:
        q = q.where(Schedule.route_id == route_id)
    if active_only:
        q = q.where(Schedule.is_active.is_(True), Route.is_active.is_(True))
    return list(db.scalars(q))


def get_schedule(db: Session, schedule_id: int) -> Schedule:
    s = db.get(Schedule, schedule_id)
    if not s:
        raise HTTPException(404, "Schedule not found")
    return s


def create_schedule(db: Session, data: ScheduleCreate) -> Schedule:
    if not db.get(Route, data.route_id):
        raise HTTPException(404, "Route not found")
    s = Schedule(**data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def update_schedule(db: Session, schedule_id: int, data: ScheduleUpdate) -> Schedule:
    s = get_schedule(db, schedule_id)
    apply_updates(s, data)
    if s.window_end <= s.window_start:
        db.rollback()
        raise HTTPException(422, "window_end must be after window_start")
    db.commit()
    db.refresh(s)
    return s


def delete_schedule(db: Session, schedule_id: int) -> None:
    s = get_schedule(db, schedule_id)
    db.delete(s)
    db.commit()


def create_override(db: Session, data: OverrideCreate) -> ScheduleOverride:
    s = get_schedule(db, data.schedule_id)
    if data.on_date.weekday() not in s.days_of_week:
        raise HTTPException(422, "Override date is not a normally scheduled day for this schedule")
    o = ScheduleOverride(**data.model_dump())
    db.add(o)
    commit_or_409(db, "An override already exists for this schedule and date")
    db.refresh(o)
    return o


def delete_override(db: Session, override_id: int) -> None:
    o = db.get(ScheduleOverride, override_id)
    if not o:
        raise HTTPException(404, "Override not found")
    db.delete(o)
    db.commit()


def schedules_for_date(db: Session, route_id: int, d: date) -> list[dict]:
    """What the citizen should expect on date d, after holidays/overrides."""
    q = select(Schedule).where(
        Schedule.route_id == route_id,
        Schedule.is_active.is_(True),
        or_(Schedule.valid_from.is_(None), Schedule.valid_from <= d),
        or_(Schedule.valid_to.is_(None), Schedule.valid_to >= d),
    )
    out = []
    for s in db.scalars(q):
        if d.weekday() not in s.days_of_week:
            continue
        ov = next((o for o in s.overrides if o.on_date == d), None)
        if ov and ov.kind == OverrideKind.CANCELLED:
            out.append(dict(schedule_id=s.id, waste_type=s.waste_type, window_start=None,
                            window_end=None, cancelled=True, note=ov.reason))
        elif ov and ov.kind == OverrideKind.RESCHEDULED:
            out.append(dict(schedule_id=s.id, waste_type=s.waste_type, window_start=ov.new_window_start,
                            window_end=ov.new_window_end, cancelled=False, note=ov.reason))
        else:
            out.append(dict(schedule_id=s.id, waste_type=s.waste_type, window_start=s.window_start,
                            window_end=s.window_end, cancelled=False, note=None))
    return out
