from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.enums import RunStatus, StopStatus, VehicleStatus
from models.complaint import Complaint
from models.route import Route
from models.route_run import RouteRun, StopVisit
from models.vehicle import Vehicle
from models.violation import Violation
from schemas.analytics import OperationsAnalytics

IST = ZoneInfo("Asia/Kolkata")

def _status_counts(db: Session, status_column, date_column, start: date, end: date) -> dict[str, int]:
    rows = db.execute(
        select(status_column, func.count())
        .where(date_column >= start, date_column <= end)
        .group_by(status_column)
    ).all()
    return {getattr(status, "value", status): count for status, count in rows}


def _timestamp_status_counts(db: Session, status_column, timestamp_column, start: date, end: date) -> dict[str, int]:
    start_at = datetime.combine(start, time.min, tzinfo=IST).astimezone(timezone.utc)
    end_at = datetime.combine(end + timedelta(days=1), time.min, tzinfo=IST).astimezone(timezone.utc)
    rows = db.execute(
        select(status_column, func.count())
        .where(timestamp_column >= start_at, timestamp_column < end_at)
        .group_by(status_column)
    ).all()
    return {getattr(status, "value", status): count for status, count in rows}


def get_operations_analytics(db: Session, start: date, end: date) -> OperationsAnalytics:
    runs = _status_counts(db, RouteRun.status, RouteRun.run_date, start, end)
    stop_rows = db.execute(
        select(StopVisit.status, func.count())
        .join(RouteRun, RouteRun.id == StopVisit.run_id)
        .where(RouteRun.run_date >= start, RouteRun.run_date <= end)
        .group_by(StopVisit.status)
    ).all()
    collection_day_rows = db.execute(
        select(RouteRun.run_date, func.count(StopVisit.id))
        .join(StopVisit, StopVisit.run_id == RouteRun.id)
        .where(
            RouteRun.run_date >= start,
            RouteRun.run_date <= end,
            StopVisit.status == StopStatus.COMPLETED,
        )
        .group_by(RouteRun.run_date)
        .order_by(RouteRun.run_date)
    ).all()
    complaints = _timestamp_status_counts(db, Complaint.status, Complaint.created_at, start, end)
    violations = _timestamp_status_counts(db, Violation.status, Violation.created_at, start, end)
    active_routes = db.scalar(select(func.count()).select_from(Route).where(Route.is_active.is_(True))) or 0
    active_vehicles = db.scalar(
        select(func.count()).select_from(Vehicle).where(Vehicle.status == VehicleStatus.ACTIVE)
    ) or 0
    completed = next((count for status, count in stop_rows if status == StopStatus.COMPLETED), 0)
    return OperationsAnalytics(
        start_date=start,
        end_date=end,
        runs_by_status=runs,
        stops_by_status={getattr(status, "value", status): count for status, count in stop_rows},
        complaints_by_status=complaints,
        violations_by_status=violations,
        active_routes=active_routes,
        active_vehicles=active_vehicles,
        total_collections=completed,
        collections_by_day=[
            {"date": run_date, "completed_stops": count}
            for run_date, count in collection_day_rows
        ],
    )