from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.enums import StopStatus
from models.route import Route, RouteStop
from models.route_run import RouteRun, StopVisit


def list_collections(
    db: Session,
    on_date: date | None,
    route_id: int | None,
    status: StopStatus | None,
    limit: int,
    offset: int,
) -> dict:
    query = (
        select(StopVisit, RouteRun, Route, RouteStop)
        .join(RouteRun, RouteRun.id == StopVisit.run_id)
        .join(Route, Route.id == RouteRun.route_id)
        .join(RouteStop, RouteStop.id == StopVisit.stop_id)
    )
    count_query = (
        select(func.count())
        .select_from(StopVisit)
        .join(RouteRun, RouteRun.id == StopVisit.run_id)
    )
    filters = []
    if on_date is not None:
        filters.append(RouteRun.run_date == on_date)
    if route_id is not None:
        filters.append(RouteRun.route_id == route_id)
    if status is not None:
        filters.append(StopVisit.status == status)
    if filters:
        query = query.where(*filters)
        count_query = count_query.where(*filters)
    rows = db.execute(
        query.order_by(RouteRun.run_date.desc(), Route.code, RouteStop.sequence)
        .limit(limit)
        .offset(offset)
    ).all()
    items = [
        {
            "run_id": run.id,
            "route_id": route.id,
            "route_code": route.code,
            "zone": route.zone,
            "stop_id": stop.id,
            "stop_name": stop.name,
            "sequence": stop.sequence,
            "collector_id": run.collector_id,
            "run_date": run.run_date,
            "run_status": run.status,
            "stop_status": visit.status,
            "visited_at": visit.visited_at,
            "note": visit.note,
        }
        for visit, run, route, stop in rows
    ]
    return {"items": items, "total": db.scalar(count_query) or 0, "limit": limit, "offset": offset}