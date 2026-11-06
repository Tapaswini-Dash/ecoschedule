from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.constants import Role
from core.enums import LocationSource, RunStatus, StopStatus, VehicleStatus
from models.route import Route
from models.route_run import RouteRun, StopVisit
from models.vehicle import Vehicle, VehicleLocation
from schemas.run import DelayIn, LocationIn, RunStart, StopStatusIn
from services import schedule_service
from services._db import commit_or_409

IST = ZoneInfo("Asia/Kolkata")          # needs `tzdata` on Windows
ACTIVE_STATUSES = (RunStatus.IN_PROGRESS, RunStatus.DELAYED)
LOCATION_STALE_MINUTES = 15             # older than this => "Location unavailable"
ETA_MIN_COMPLETED_STOPS = 3             # below this we do NOT show an estimate

DISCLAIMER = (
    "Position is the last one reported by the collector, not live GPS. "
    "Any arrival time is an estimate based on stops already completed today."
)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def today_ist() -> date:
    return datetime.now(IST).date()


def _is_collector(user) -> bool:
    return Role(user.role) == Role.COLLECTOR


def get_run(db: Session, run_id: int, user) -> RouteRun:
    run = db.get(RouteRun, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    if _is_collector(user) and run.collector_id != user.id:
        raise HTTPException(403, "This run is assigned to another collector")
    return run


def _require_active(run: RouteRun) -> None:
    if run.status not in ACTIVE_STATUSES:
        raise HTTPException(409, f"Run is {run.status.value}; it must be in progress")


def start_run(db: Session, user, data: RunStart) -> RouteRun:
    route = db.get(Route, data.route_id)
    if not route or not route.is_active:
        raise HTTPException(404, "Active route not found")
    if not route.stops:
        raise HTTPException(400, "Route has no stops")

    vehicle_id = data.vehicle_id
    if vehicle_id is None:
        assigned = db.scalar(
            select(Vehicle).where(
                Vehicle.assigned_route_id == route.id, Vehicle.status == VehicleStatus.ACTIVE
            )
        )
        vehicle_id = assigned.id if assigned else None
    else:
        v = db.get(Vehicle, vehicle_id)
        if not v or v.status != VehicleStatus.ACTIVE:
            raise HTTPException(400, "Vehicle not found or not active")

    today = today_ist()
    clash = db.scalar(
        select(RouteRun.id).where(
            RouteRun.route_id == route.id,
            RouteRun.run_date == today,
            RouteRun.status.in_(ACTIVE_STATUSES),
        )
    )
    if clash:
        raise HTTPException(409, "This route already has a run in progress today")

    collector_id = user.id if _is_collector(user) else data.collector_id
    run = RouteRun(
        route_id=route.id,
        vehicle_id=vehicle_id,
        collector_id=collector_id,
        run_date=today,
        status=RunStatus.IN_PROGRESS,
        started_at=now_utc(),
    )
    run.visits = [StopVisit(stop_id=s.id, status=StopStatus.PENDING) for s in route.stops]
    db.add(run)
    commit_or_409(db, "Could not start run")
    db.refresh(run)
    return run


def list_my_runs(db: Session, user, only_today: bool) -> list[RouteRun]:
    q = select(RouteRun).where(RouteRun.collector_id == user.id).order_by(RouteRun.id.desc())
    if only_today:
        q = q.where(RouteRun.run_date == today_ist())
    return list(db.scalars(q.limit(100)))


def record_location(db: Session, user, run_id: int, data: LocationIn) -> VehicleLocation:
    run = get_run(db, run_id, user)
    _require_active(run)
    if run.vehicle_id is None:
        raise HTTPException(400, "No vehicle is linked to this run")
    loc = VehicleLocation(
        vehicle_id=run.vehicle_id,
        run_id=run.id,
        latitude=data.latitude,
        longitude=data.longitude,
        recorded_at=now_utc(),               # server time, not client time
        source=LocationSource.COLLECTOR,
        recorded_by_id=user.id,
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


def update_stop(db: Session, user, run_id: int, stop_id: int, data: StopStatusIn) -> RouteRun:
    run = get_run(db, run_id, user)
    _require_active(run)
    visit = db.scalar(select(StopVisit).where(StopVisit.run_id == run_id, StopVisit.stop_id == stop_id))
    if not visit:
        raise HTTPException(404, "Stop is not part of this run")
    visit.status = data.status
    visit.note = data.note
    visit.visited_at = now_utc() if data.status in (StopStatus.COMPLETED, StopStatus.MISSED) else None
    db.commit()
    db.refresh(run)
    return run


def report_delay(db: Session, user, run_id: int, data: DelayIn) -> RouteRun:
    run = get_run(db, run_id, user)
    _require_active(run)
    run.status = RunStatus.DELAYED
    run.delay_minutes = data.delay_minutes
    run.delay_reason = data.reason
    run.delay_revised_time = data.revised_time
    db.commit()
    db.refresh(run)
    return run


def end_run(db: Session, user, run_id: int) -> RouteRun:
    run = get_run(db, run_id, user)
    _require_active(run)
    run.status = RunStatus.COMPLETED
    run.ended_at = now_utc()
    # Stops still "pending" are left as pending: we never guess they were missed.
    db.commit()
    db.refresh(run)
    return run


# ---------- citizen-facing tracking ----------

def _eta(run: RouteRun) -> dict:
    done = sorted(
        (v.visited_at for v in run.visits if v.status == StopStatus.COMPLETED and v.visited_at)
    )
    remaining = sum(1 for v in run.visits if v.status in (StopStatus.PENDING, StopStatus.IN_PROGRESS))
    if run.status == RunStatus.COMPLETED:
        return dict(available=False, basis="Route completed")
    if len(done) < ETA_MIN_COMPLETED_STOPS:
        return dict(available=False, basis="Not enough completed stops yet to estimate")
    if remaining == 0:
        return dict(available=False, basis="No stops remaining")
    gaps = [(b - a).total_seconds() for a, b in zip(done, done[1:])]
    avg = sum(gaps) / len(gaps)
    est = done[-1].timestamp() + avg * remaining
    return dict(
        available=True,
        estimated_completion=datetime.fromtimestamp(est, tz=timezone.utc),
        basis=f"Estimate from {len(done)} completed stops today (average pace)",
    )


def track_route(db: Session, route_id: int) -> dict:
    route = db.get(Route, route_id)
    if not route or not route.is_active:
        raise HTTPException(404, "Route not found")
    today = today_ist()
    scheduled = schedule_service.schedules_for_date(db, route_id, today)

    run = db.scalar(
        select(RouteRun)
        .where(RouteRun.route_id == route_id, RouteRun.run_date == today)
        .order_by(RouteRun.id.desc())
        .limit(1)
    )
    vehicle = db.get(Vehicle, run.vehicle_id) if run and run.vehicle_id else db.scalar(
        select(Vehicle).where(
            Vehicle.assigned_route_id == route.id,
            Vehicle.status == VehicleStatus.ACTIVE,
        ).order_by(Vehicle.id).limit(1)
    )
    base = dict(
        route_id=route.id, route_code=route.code, zone=route.zone,
        vehicle_registration=vehicle.registration if vehicle else None,
        vehicle_type=vehicle.type if vehicle else None,
        scheduled_today=scheduled, disclaimer=DISCLAIMER,
    )
    if run is None:
        return {
            **base, "run_id": None, "run_status": RunStatus.NOT_STARTED,
            "location": dict(available=False, message="Collection has not started. See the scheduled time."),
            "eta": dict(available=False, basis="Collection has not started"),
        }

    location = dict(available=False, message="Location unavailable. See the scheduled time.")
    if run.vehicle_id and run.status in ACTIVE_STATUSES:
        loc = db.scalar(
            select(VehicleLocation)
            .where(VehicleLocation.vehicle_id == run.vehicle_id, VehicleLocation.run_id == run.id)
            .order_by(VehicleLocation.recorded_at.desc())
            .limit(1)
        )
        if loc:
            age = int((now_utc() - loc.recorded_at).total_seconds() // 60)
            if age <= LOCATION_STALE_MINUTES:
                location = dict(
                    available=True,
                    message=(
                        "Simulated route position. This is not a GPS report."
                        if loc.is_demo
                        else "Last reported position (not live GPS)"
                    ),
                    latitude=loc.latitude, longitude=loc.longitude, recorded_at=loc.recorded_at,
                    age_minutes=age, source=loc.source, is_demo=loc.is_demo,
                )

        if not location["available"] and route.is_demo:
            route_stops = route.stops
            next_index = next(
                (
                    index for index, stop in enumerate(route_stops)
                    if any(
                        visit.stop_id == stop.id
                        and visit.status in (StopStatus.PENDING, StopStatus.IN_PROGRESS)
                        for visit in run.visits
                    )
                ),
                len(route_stops) - 1,
            )
            if route_stops:
                previous_stop = route_stops[max(next_index - 1, 0)]
                next_stop = route_stops[next_index]
                location = dict(
                    available=True,
                    message="Simulated route position. This is not a GPS report.",
                    latitude=(previous_stop.latitude + next_stop.latitude) / 2,
                    longitude=(previous_stop.longitude + next_stop.longitude) / 2,
                    recorded_at=now_utc(),
                    age_minutes=0,
                    source=LocationSource.SIMULATION,
                    is_demo=True,
                )

    return {
        **base,
        "run_id": run.id,
        "run_status": run.status,
        "delay_minutes": run.delay_minutes,
        "delay_reason": run.delay_reason,
        "delay_revised_time": run.delay_revised_time,
        "stops_total": len(run.visits),
        "stops_completed": sum(v.status == StopStatus.COMPLETED for v in run.visits),
        "stops_missed": sum(v.status == StopStatus.MISSED for v in run.visits),
        "location": location,
        "eta": _eta(run),
    }
