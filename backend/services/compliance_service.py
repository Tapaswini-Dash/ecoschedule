from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.violation import Violation
from models.route import Route
from schemas.compliance import ViolationCreate, ViolationUpdate


def list_violations(db: Session) -> list[Violation]:
    return list(db.scalars(select(Violation).order_by(Violation.created_at.desc()).limit(500)))


def report_violation(db: Session, reporter_id: int, data: ViolationCreate) -> Violation:
    if data.route_id is not None and db.get(Route, data.route_id) is None:
        raise HTTPException(404, "Route not found")
    violation = Violation(
        reported_by_id=reporter_id,
        route_id=data.route_id,
        category=data.category.strip(),
        severity=data.severity,
        description=data.description.strip(),
    )
    db.add(violation)
    db.commit()
    db.refresh(violation)
    return violation


def update_violation(db: Session, violation_id: int, data: ViolationUpdate) -> Violation:
    violation = db.get(Violation, violation_id)
    if violation is None:
        raise HTTPException(404, "Violation not found")
    violation.status = data.status
    violation.resolution = data.resolution
    violation.resolved_at = datetime.now(timezone.utc) if data.status in ("resolved", "dismissed") else None
    db.commit()
    db.refresh(violation)
    return violation