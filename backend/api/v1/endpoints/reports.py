from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from core.constants import Role
from core.permissions import require_roles
from schemas.analytics import OperationsAnalytics
from services import report_service
from services.run_service import today_ist

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
    dependencies=[Depends(require_roles(Role.ADMIN))],
)


@router.get("/summary", response_model=OperationsAnalytics)
def summary(start_date: date | None = None, end_date: date | None = None,
            db: Session = Depends(get_db)):
    end = end_date or today_ist()
    start = start_date or end - timedelta(days=29)
    if start > end:
        raise HTTPException(422, "start_date must be on or before end_date")
    return report_service.build_summary(db, start, end)