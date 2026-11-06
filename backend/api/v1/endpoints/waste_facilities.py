from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from core.constants import Role
from core.permissions import require_roles
from schemas.waste_facility import WasteFacilityCreate, WasteFacilityOut, WasteFacilityUpdate
from services import facility_service

router = APIRouter(prefix="/waste-facilities", tags=["waste facilities"])


@router.get("", response_model=list[WasteFacilityOut],
            dependencies=[Depends(require_roles(Role.ADMIN, Role.COLLECTOR, Role.CITIZEN))])
def list_facilities(include_inactive: bool = False, db: Session = Depends(get_db)):
    return facility_service.list_facilities(db, active_only=not include_inactive)


@router.post("", response_model=WasteFacilityOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(Role.ADMIN))])
def create_facility(data: WasteFacilityCreate, db: Session = Depends(get_db)):
    return facility_service.create_facility(db, data)


@router.patch("/{facility_id}", response_model=WasteFacilityOut,
              dependencies=[Depends(require_roles(Role.ADMIN))])
def update_facility(facility_id: int, data: WasteFacilityUpdate, db: Session = Depends(get_db)):
    return facility_service.update_facility(db, facility_id, data)


@router.delete("/{facility_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_roles(Role.ADMIN))])
def deactivate_facility(facility_id: int, db: Session = Depends(get_db)):
    facility_service.deactivate_facility(db, facility_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)