from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from core.constants import Role
from core.permissions import require_roles
from schemas.dashboard import DashboardSummary
from services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary,
            dependencies=[Depends(require_roles(Role.ADMIN))])
def summary(db: Session = Depends(get_db)):
    return dashboard_service.get_summary(db)