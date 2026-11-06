from datetime import date

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from core.constants import Role
from core.permissions import require_roles
from schemas.schedule import (OverrideCreate, OverrideOut, ScheduleCreate, ScheduleOnDate,
                              ScheduleOut, ScheduleUpdate)
from services import schedule_service
from services.run_service import today_ist

router = APIRouter(prefix="/schedules", tags=["schedules"])
admin_only = require_roles(Role.ADMIN)


@router.get("", response_model=list[ScheduleOut])
def list_schedules(zone: str | None = None, route_id: int | None = None,
                   db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Citizens call this with ?zone=<area/ward>."""
    return schedule_service.list_schedules(db, zone, route_id)


@router.get("/on-date", response_model=list[ScheduleOnDate])
def schedule_on_date(route_id: int, on: date | None = None,
                     db: Session = Depends(get_db), user=Depends(get_current_user)):
    return schedule_service.schedules_for_date(db, route_id, on or today_ist())


@router.post("", response_model=ScheduleOut, status_code=201)
def create_schedule(data: ScheduleCreate, db: Session = Depends(get_db), user=Depends(admin_only)):
    return schedule_service.create_schedule(db, data)


@router.patch("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(schedule_id: int, data: ScheduleUpdate,
                    db: Session = Depends(get_db), user=Depends(admin_only)):
    return schedule_service.update_schedule(db, schedule_id, data)


@router.delete("/{schedule_id}", status_code=204)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db), user=Depends(admin_only)):
    schedule_service.delete_schedule(db, schedule_id)
    return Response(status_code=204)


@router.post("/overrides", response_model=OverrideOut, status_code=201)
def create_override(data: OverrideCreate, db: Session = Depends(get_db), user=Depends(admin_only)):
    return schedule_service.create_override(db, data)


@router.delete("/overrides/{override_id}", status_code=204)
def delete_override(override_id: int, db: Session = Depends(get_db), user=Depends(admin_only)):
    schedule_service.delete_override(db, override_id)
    return Response(status_code=204)
