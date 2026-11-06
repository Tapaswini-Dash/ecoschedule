from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.dependencies import get_db
from core.constants import Role
from core.enums import VehicleStatus
from core.permissions import require_roles
from schemas.vehicle import VehicleCreate, VehicleLocationOut, VehicleOut, VehicleUpdate
from services import vehicle_service

router = APIRouter(prefix="/vehicles", tags=["vehicles"])
admin_only = require_roles(Role.ADMIN)
staff = require_roles(Role.ADMIN, Role.COLLECTOR)


@router.get("", response_model=list[VehicleOut])
def list_vehicles(status: VehicleStatus | None = None, db: Session = Depends(get_db), user=Depends(staff)):
    return vehicle_service.list_vehicles(db, status)


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), user=Depends(staff)):
    return vehicle_service.get_vehicle(db, vehicle_id)


@router.get("/{vehicle_id}/last-location", response_model=VehicleLocationOut | None)
def last_location(vehicle_id: int, db: Session = Depends(get_db), user=Depends(admin_only)):
    return vehicle_service.last_location(db, vehicle_id)


@router.post("", response_model=VehicleOut, status_code=201)
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db), user=Depends(admin_only)):
    return vehicle_service.create_vehicle(db, data)


@router.patch("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(vehicle_id: int, data: VehicleUpdate, db: Session = Depends(get_db), user=Depends(admin_only)):
    return vehicle_service.update_vehicle(db, vehicle_id, data)


@router.delete("/{vehicle_id}", status_code=204)
def retire_vehicle(vehicle_id: int, db: Session = Depends(get_db), user=Depends(admin_only)):
    vehicle_service.delete_vehicle(db, vehicle_id)
    return Response(status_code=204)
