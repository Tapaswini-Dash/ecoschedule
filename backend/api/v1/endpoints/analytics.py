from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from core.constants import Role
from core.permissions import require_roles
from schemas.analytics import OperationsAnalytics
from services import analytics_service
from services.run_service import today_ist

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    dependencies=[Depends(require_roles(Role.ADMIN))],
)


@router.get("/operations", response_model=OperationsAnalytics)
def operations(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
):
    end = end_date or today_ist()
    start = start_date or end - timedelta(days=29)
    if start > end:
        from fastapi import HTTPException

        raise HTTPException(422, "start_date must be on or before end_date")
    return analytics_service.get_operations_analytics(db, start, end)