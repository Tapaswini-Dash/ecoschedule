from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from core.constants import Role
from core.enums import RunStatus
from core.permissions import require_roles
from schemas.run_admin import ActiveRunOut, RunPage
from services import run_admin_service

router = APIRouter(prefix="/runs", tags=["runs (admin)"],
                   dependencies=[Depends(require_roles(Role.ADMIN))])


@router.get("", response_model=RunPage)
def list_runs(
    on_date: date | None = Query(None, alias="date"),
    status: RunStatus | None = None,
    route_id: int | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return run_admin_service.list_runs(db, on_date, status, route_id, limit, offset)


@router.get("/active", response_model=list[ActiveRunOut])
def active_runs(db: Session = Depends(get_db)):
    return run_admin_service.list_active_runs(db)