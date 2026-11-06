from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from core.constants import Role
from core.permissions import require_roles
from schemas.run import DelayIn, LocationIn, RunOut, RunStart, StopStatusIn, TrackOut
from schemas.vehicle import VehicleLocationOut
from services import run_service

router = APIRouter(prefix="/runs", tags=["runs"])
field_staff = require_roles(Role.COLLECTOR, Role.ADMIN)


# NOTE: fixed paths (/my, /track) must stay above /{run_id}.

@router.get("/track", response_model=TrackOut)
def track(route_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Citizen view: last reported position (with time) or 'Location unavailable'."""
    return run_service.track_route(db, route_id)


@router.get("/my", response_model=list[RunOut])
def my_runs(today: bool = True, db: Session = Depends(get_db), user=Depends(field_staff)):
    return run_service.list_my_runs(db, user, today)


@router.post("/start", response_model=RunOut, status_code=201)
def start_run(data: RunStart, db: Session = Depends(get_db), user=Depends(field_staff)):
    return run_service.start_run(db, user, data)


@router.get("/{run_id}", response_model=RunOut)
def get_run(run_id: int, db: Session = Depends(get_db), user=Depends(field_staff)):
    return run_service.get_run(db, run_id, user)


@router.post("/{run_id}/location", response_model=VehicleLocationOut, status_code=201)
def post_location(run_id: int, data: LocationIn, db: Session = Depends(get_db), user=Depends(field_staff)):
    return run_service.record_location(db, user, run_id, data)


@router.patch("/{run_id}/stops/{stop_id}", response_model=RunOut)
def set_stop_status(run_id: int, stop_id: int, data: StopStatusIn,
                    db: Session = Depends(get_db), user=Depends(field_staff)):
    return run_service.update_stop(db, user, run_id, stop_id, data)


@router.post("/{run_id}/delay", response_model=RunOut)
def report_delay(run_id: int, data: DelayIn, db: Session = Depends(get_db), user=Depends(field_staff)):
    return run_service.report_delay(db, user, run_id, data)


@router.post("/{run_id}/end", response_model=RunOut)
def end_run(run_id: int, db: Session = Depends(get_db), user=Depends(field_staff)):
    return run_service.end_run(db, user, run_id)
