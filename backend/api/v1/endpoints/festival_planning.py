from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from core.constants import Role
from core.permissions import require_roles
from models.user import User
from schemas.festival_event import FestivalEventCreate, FestivalEventOut, FestivalEventUpdate
from services import festival_service

router = APIRouter(prefix="/festivals", tags=["festivals"])


@router.get("", response_model=list[FestivalEventOut], dependencies=[Depends(get_current_user)])
def list_events(db: Session = Depends(get_db)):
    return festival_service.list_events(db)


@router.post("", response_model=FestivalEventOut, status_code=status.HTTP_201_CREATED)
def create_event(data: FestivalEventCreate, db: Session = Depends(get_db),
                 admin: User = Depends(require_roles(Role.ADMIN))):
    return festival_service.create_event(db, admin.id, data)


@router.patch("/{event_id}", response_model=FestivalEventOut)
def update_event(event_id: int, data: FestivalEventUpdate, db: Session = Depends(get_db),
                 _admin: User = Depends(require_roles(Role.ADMIN))):
    return festival_service.update_event(db, event_id, data)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(get_db),
                 _admin: User = Depends(require_roles(Role.ADMIN))):
    festival_service.delete_event(db, event_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)