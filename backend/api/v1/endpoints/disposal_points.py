from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from core.constants import Role
from core.permissions import require_roles
from schemas.disposal_point import DisposalPointCreate, DisposalPointOut, DisposalPointUpdate
from services import disposal_point_service

router = APIRouter(prefix="/disposal-points", tags=["disposal points"])


@router.get("", response_model=list[DisposalPointOut], dependencies=[Depends(require_roles(Role.ADMIN, Role.COLLECTOR, Role.CITIZEN))])
def list_points(include_inactive: bool = False, db: Session = Depends(get_db)):
    return disposal_point_service.list_points(db, active_only=not include_inactive)


@router.post("", response_model=DisposalPointOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(Role.ADMIN))])
def create_point(data: DisposalPointCreate, db: Session = Depends(get_db)):
    return disposal_point_service.create_point(db, data)


@router.patch("/{point_id}", response_model=DisposalPointOut,
              dependencies=[Depends(require_roles(Role.ADMIN))])
def update_point(point_id: int, data: DisposalPointUpdate, db: Session = Depends(get_db)):
    return disposal_point_service.update_point(db, point_id, data)


@router.delete("/{point_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_roles(Role.ADMIN))])
def deactivate_point(point_id: int, db: Session = Depends(get_db)):
    disposal_point_service.deactivate_point(db, point_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)