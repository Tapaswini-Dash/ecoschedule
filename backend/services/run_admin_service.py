from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from core.enums import RunStatus, StopStatus
from models.route import Route
from models.route_run import RouteRun
from models.user import User
from models.vehicle import VehicleLocation
from schemas.run import TrackLocation
from schemas.run_admin import ActiveRunOut, RunListItem, RunPage
from services.run_service import ACTIVE_STATUSES, LOCATION_STALE_MINUTES, now_utc


def _lookups(db: Session, runs: list[RouteRun]):
    route_ids = {r.route_id for r in runs}
    user_ids = {r.collector_id for r in runs if r.collector_id}
    routes = {r.id: r for r in db.scalars(select(Route).where(Route.id.in_(route_ids)))} if route_ids else {}
    names = dict(db.execute(select(User.id, User.full_name).where(User.id.in_(user_ids))).all()) if user_ids else {}
    return routes, names


def _item_fields(run: RouteRun, routes: dict, names: dict) -> dict:
    visits = run.visits
    done = sum(v.status == StopStatus.COMPLETED for v in visits)
    missed = sum(v.status == StopStatus.MISSED for v in visits)
    route = routes.get(run.route_id)
    return dict(
        id=run.id, route_id=run.route_id,
        route_code=route.code if route else "?", zone=route.zone if route else "",
        vehicle_id=run.vehicle_id, collector_id=run.collector_id,
        collector_name=names.get(run.collector_id),
        run_date=run.run_date, status=run.status,
        started_at=run.started_at, ended_at=run.ended_at,
        delay_minutes=run.delay_minutes, delay_reason=run.delay_reason,
        stops_total=len(visits), stops_completed=done, stops_missed=missed,
        stops_pending=len(visits) - done - missed,
    )


def list_runs(db: Session, on_date: date | None, status: RunStatus | None,
              route_id: int | None, limit: int, offset: int) -> RunPage:
    filters = []
    if on_date:
        filters.append(RouteRun.run_date == on_date)
    if status:
        filters.append(RouteRun.status == status)
    if route_id:
        filters.append(RouteRun.route_id == route_id)

    total = db.scalar(select(func.count()).select_from(RouteRun).where(*filters)) or 0
    runs = list(db.scalars(
        select(RouteRun).where(*filters)
        .options(selectinload(RouteRun.visits))
        .order_by(RouteRun.run_date.desc(), RouteRun.id.desc())
        .limit(limit).offset(offset)
    ))
    routes, names = _lookups(db, runs)
    return RunPage(
        items=[RunListItem(**_item_fields(r, routes, names)) for r in runs],
        total=total, limit=limit, offset=offset,
    )


def _location_for(db: Session, run: RouteRun) -> TrackLocation:
    loc = db.scalar(
        select(VehicleLocation).where(VehicleLocation.run_id == run.id)
        .order_by(VehicleLocation.recorded_at.desc()).limit(1)
    )
    if loc is None:
        return TrackLocation(available=False, message="No position reported yet for this run.")
    age = int((now_utc() - loc.recorded_at).total_seconds() // 60)
    if age > LOCATION_STALE_MINUTES:
        # Stale: never shown as current. No coordinates are returned.
        return TrackLocation(
            available=False,
            message=f"Location unavailable. Last report was {age} min ago.",
            recorded_at=loc.recorded_at, age_minutes=age,
            source=loc.source, is_demo=loc.is_demo,
        )
    return TrackLocation(
        available=True,
        message="Last reported position (not live GPS)" + (". DEMO DATA." if loc.is_demo else ""),
        latitude=loc.latitude, longitude=loc.longitude,
        recorded_at=loc.recorded_at, age_minutes=age,
        source=loc.source, is_demo=loc.is_demo,
    )


def list_active_runs(db: Session) -> list[ActiveRunOut]:
    runs = list(db.scalars(
        select(RouteRun).where(RouteRun.status.in_(ACTIVE_STATUSES))
        .options(selectinload(RouteRun.visits))
        .order_by(RouteRun.id.desc())
    ))
    routes, names = _lookups(db, runs)
    return [
        ActiveRunOut(
            **_item_fields(r, routes, names),
            delay_revised_time=r.delay_revised_time,
            location=_location_for(db, r),
        )
        for r in runs
    ]