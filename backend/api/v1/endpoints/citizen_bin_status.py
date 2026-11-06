from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from core.constants import Role
from core.permissions import require_roles
from models.user import User
from schemas.citizen_bin_status import CitizenBinStatusOut, CitizenBinStatusUpdate
from services import citizen_bin_status_service

router = APIRouter(prefix="/citizen-bin-status", tags=["citizen bin status"])


@router.get("/me", response_model=CitizenBinStatusOut | None)
def get_my_status(
    db: Session = Depends(get_db),
    citizen: User = Depends(require_roles(Role.CITIZEN)),
):
    return citizen_bin_status_service.get_status(db, citizen.id)


@router.post("/me", response_model=CitizenBinStatusOut)
def report_my_status(
    data: CitizenBinStatusUpdate,
    db: Session = Depends(get_db),
    citizen: User = Depends(require_roles(Role.CITIZEN)),
):
    return citizen_bin_status_service.report_status(db, citizen.id, data.fill_level)
