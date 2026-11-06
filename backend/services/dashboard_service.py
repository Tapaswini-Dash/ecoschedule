from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.enums import RunStatus, StopStatus, VehicleStatus
from models.route import Route
from models.complaint import Complaint
from models.route_run import RouteRun, StopVisit
from models.vehicle import Vehicle
from schemas.dashboard import DashboardSummary, DelayedRunOut
from services.run_service import now_utc, today_ist


def _counts(rows, enum_cls) -> dict[str, int]:
    out = {m.value: 0 for m in enum_cls}
    for key, n in rows:
        out[getattr(key, "value", key)] = n
    return out


def get_summary(db: Session) -> DashboardSummary:
    today = today_ist()

    active_routes = db.scalar(
        select(func.count()).select_from(Route).where(Route.is_active.is_(True))
    ) or 0
    open_complaints = db.scalar(
        select(func.count()).select_from(Complaint).where(Complaint.status.in_(("open", "in_progress")))
    ) or 0

    vehicles = _counts(
        db.execute(select(Vehicle.status, func.count()).group_by(Vehicle.status)).all(),
        VehicleStatus,
    )
    runs = _counts(
        db.execute(
            select(RouteRun.status, func.count())
            .where(RouteRun.run_date == today)
            .group_by(RouteRun.status)
        ).all(),
        RunStatus,
    )
    stops = _counts(
        db.execute(
            select(StopVisit.status, func.count())
            .join(RouteRun, RouteRun.id == StopVisit.run_id)
            .where(RouteRun.run_date == today)
            .group_by(StopVisit.status)
        ).all(),
        StopStatus,
    )

    delayed_rows = db.execute(
        select(RouteRun, Route.code)
        .join(Route, Route.id == RouteRun.route_id)
        .where(RouteRun.run_date == today, RouteRun.status == RunStatus.DELAYED)
        .order_by(RouteRun.delay_minutes.desc())
    ).all()

    return DashboardSummary(
        generated_at=now_utc(),
        today=today,
        active_routes=active_routes,
        vehicles_by_status=vehicles,
        runs_today_by_status=runs,
        stops_completed=stops.get("completed", 0),
        stops_missed=stops.get("missed", 0),
        stops_pending=stops.get("pending", 0) + stops.get("in_progress", 0),
        complaints_available=True,
        open_complaints=open_complaints,
        delayed_runs=[
            DelayedRunOut(
                run_id=r.id, route_id=r.route_id, route_code=code,
                delay_minutes=r.delay_minutes, delay_reason=r.delay_reason,
                delay_revised_time=r.delay_revised_time,
            )
            for r, code in delayed_rows
        ],
    )