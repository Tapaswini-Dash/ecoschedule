from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.disposal_point import DisposalPoint
from schemas.disposal_point import DisposalPointCreate, DisposalPointUpdate


def list_points(db: Session, active_only: bool = True) -> list[DisposalPoint]:
    query = select(DisposalPoint).order_by(DisposalPoint.name)
    if active_only:
        query = query.where(DisposalPoint.is_active.is_(True))
    return list(db.scalars(query))


def create_point(db: Session, data: DisposalPointCreate) -> DisposalPoint:
    point = DisposalPoint(**data.model_dump())
    db.add(point)
    db.commit()
    db.refresh(point)
    return point


def update_point(db: Session, point_id: int, data: DisposalPointUpdate) -> DisposalPoint:
    point = db.get(DisposalPoint, point_id)
    if point is None:
        raise HTTPException(404, "Disposal point not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(point, key, value)
    db.commit()
    db.refresh(point)
    return point


def deactivate_point(db: Session, point_id: int) -> None:
    point = db.get(DisposalPoint, point_id)
    if point is None:
        raise HTTPException(404, "Disposal point not found")
    point.is_active = False
    db.commit()