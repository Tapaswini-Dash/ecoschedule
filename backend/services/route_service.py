from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.route import Route, RouteStop
from models.route_run import StopVisit
from schemas.route import RouteCreate, RouteUpdate, StopIn, StopUpdate
from services._db import apply_updates, commit_or_409


def list_routes(db: Session, zone: str | None, active_only: bool) -> list[Route]:
    q = select(Route).order_by(Route.code)
    if zone:
        q = q.where(Route.zone.ilike(zone))
    if active_only:
        q = q.where(Route.is_active.is_(True))
    return list(db.scalars(q))


def get_route(db: Session, route_id: int) -> Route:
    route = db.get(Route, route_id)
    if not route:
        raise HTTPException(404, "Route not found")
    return route


def create_route(db: Session, data: RouteCreate) -> Route:
    route = Route(code=data.code, name=data.name, zone=data.zone, is_active=data.is_active)
    route.stops = [RouteStop(**s.model_dump()) for s in data.stops]
    db.add(route)
    commit_or_409(db, "Route code already exists, or stop sequences are duplicated")
    db.refresh(route)
    return route


def update_route(db: Session, route_id: int, data: RouteUpdate) -> Route:
    route = get_route(db, route_id)
    apply_updates(route, data)
    commit_or_409(db, "Route code already exists")
    db.refresh(route)
    return route


def deactivate_route(db: Session, route_id: int) -> None:
    """Soft delete: past runs and complaints keep pointing at the route."""
    route = get_route(db, route_id)
    route.is_active = False
    db.commit()


def add_stop(db: Session, route_id: int, data: StopIn) -> RouteStop:
    get_route(db, route_id)
    stop = RouteStop(route_id=route_id, **data.model_dump())
    db.add(stop)
    commit_or_409(db, "A stop with this sequence already exists on the route")
    db.refresh(stop)
    return stop


def update_stop(db: Session, stop_id: int, data: StopUpdate) -> RouteStop:
    stop = db.get(RouteStop, stop_id)
    if not stop:
        raise HTTPException(404, "Stop not found")
    apply_updates(stop, data)
    commit_or_409(db, "A stop with this sequence already exists on the route")
    db.refresh(stop)
    return stop


def delete_stop(db: Session, stop_id: int) -> None:
    stop = db.get(RouteStop, stop_id)
    if not stop:
        raise HTTPException(404, "Stop not found")
    if db.scalar(select(StopVisit.id).where(StopVisit.stop_id == stop_id).limit(1)):
        raise HTTPException(409, "Stop has visit history and cannot be deleted")
    db.delete(stop)
    db.commit()
