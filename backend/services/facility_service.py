from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.waste_facility import WasteFacility
from schemas.waste_facility import WasteFacilityCreate, WasteFacilityUpdate


def list_facilities(db: Session, active_only: bool = True) -> list[WasteFacility]:
    query = select(WasteFacility).order_by(WasteFacility.name)
    if active_only:
        query = query.where(WasteFacility.is_active.is_(True))
    return list(db.scalars(query))


def _validate_coordinates(data: dict, existing: WasteFacility | None = None) -> None:
    latitude = data.get("latitude", existing.latitude if existing else None)
    longitude = data.get("longitude", existing.longitude if existing else None)
    if (latitude is None) != (longitude is None):
        raise HTTPException(422, "Latitude and longitude must be provided together")


def create_facility(db: Session, data: WasteFacilityCreate) -> WasteFacility:
    facility = WasteFacility(**data.model_dump())
    db.add(facility)
    db.commit()
    db.refresh(facility)
    return facility


def update_facility(db: Session, facility_id: int, data: WasteFacilityUpdate) -> WasteFacility:
    facility = db.get(WasteFacility, facility_id)
    if facility is None:
        raise HTTPException(404, "Waste facility not found")
    changes = data.model_dump(exclude_unset=True)
    _validate_coordinates(changes, facility)
    for key, value in changes.items():
        setattr(facility, key, value)
    db.commit()
    db.refresh(facility)
    return facility


def deactivate_facility(db: Session, facility_id: int) -> None:
    facility = db.get(WasteFacility, facility_id)
    if facility is None:
        raise HTTPException(404, "Waste facility not found")
    facility.is_active = False
    db.commit()