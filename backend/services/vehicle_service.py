from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.enums import VehicleStatus
from models.route import Route
from models.vehicle import Vehicle, VehicleLocation
from schemas.vehicle import VehicleCreate, VehicleUpdate
from services._db import apply_updates, commit_or_409


def list_vehicles(db: Session, status: VehicleStatus | None):
    q = select(Vehicle).order_by(Vehicle.registration)
    if status:
        q = q.where(Vehicle.status == status)
    return list(db.scalars(q))


def get_vehicle(db: Session, vehicle_id: int) -> Vehicle:
    v = db.get(Vehicle, vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found")
    return v


def _check_route(db: Session, route_id: int | None) -> None:
    if route_id is not None and not db.get(Route, route_id):
        raise HTTPException(404, "Assigned route not found")


def create_vehicle(db: Session, data: VehicleCreate) -> Vehicle:
    _check_route(db, data.assigned_route_id)
    v = Vehicle(**data.model_dump())
    db.add(v)
    commit_or_409(db, "Registration already exists")
    db.refresh(v)
    return v


def update_vehicle(db: Session, vehicle_id: int, data: VehicleUpdate) -> Vehicle:
    v = get_vehicle(db, vehicle_id)
    _check_route(db, data.assigned_route_id)
    apply_updates(v, data)
    commit_or_409(db, "Registration already exists")
    db.refresh(v)
    return v


def delete_vehicle(db: Session, vehicle_id: int) -> None:
    """Soft delete: mark off duty and unassign (location history is kept)."""
    v = get_vehicle(db, vehicle_id)
    v.status = VehicleStatus.OFF_DUTY
    v.assigned_route_id = None
    db.commit()


def last_location(db: Session, vehicle_id: int) -> VehicleLocation | None:
    get_vehicle(db, vehicle_id)
    return db.scalar(
        select(VehicleLocation)
        .where(VehicleLocation.vehicle_id == vehicle_id)
        .order_by(VehicleLocation.recorded_at.desc())
        .limit(1)
    )
