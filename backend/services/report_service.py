from datetime import date

from sqlalchemy.orm import Session

from schemas.analytics import OperationsAnalytics
from services.analytics_service import get_operations_analytics


def build_summary(db: Session, start: date, end: date) -> OperationsAnalytics:
    return get_operations_analytics(db, start, end)