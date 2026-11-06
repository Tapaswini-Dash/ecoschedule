from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.complaint import Complaint
from models.complaint_update import ComplaintUpdate
from models.route import Route
from models.user import User
from schemas.complaint import ComplaintCreate, ComplaintStatusUpdate
from services import notification_service


def create_complaint(db: Session, user: User, data: ComplaintCreate) -> Complaint:
    if data.route_id is not None and db.get(Route, data.route_id) is None:
        raise HTTPException(404, "Route not found")
    complaint = Complaint(
        citizen_id=user.id,
        route_id=data.route_id,
        category=data.category.strip(),
        description=data.description.strip(),
        status="open",
    )
    db.add(complaint)
    db.flush()
    db.add(ComplaintUpdate(
        complaint_id=complaint.id,
        author_id=user.id,
        status="open",
        message="Complaint submitted.",
    ))
    db.commit()
    db.refresh(complaint)
    return complaint


def list_complaints(db: Session, citizen_id: int | None = None) -> list[Complaint]:
    query = select(Complaint).order_by(Complaint.created_at.desc(), Complaint.id.desc())
    if citizen_id is not None:
        query = query.where(Complaint.citizen_id == citizen_id)
    return list(db.scalars(query.limit(500)))


def update_complaint(
    db: Session,
    admin: User,
    complaint_id: int,
    data: ComplaintStatusUpdate,
) -> Complaint:
    complaint = db.get(Complaint, complaint_id)
    if complaint is None:
        raise HTTPException(404, "Complaint not found")
    complaint.status = data.status
    db.add(ComplaintUpdate(
        complaint_id=complaint.id,
        author_id=admin.id,
        status=data.status,
        message=data.message.strip(),
    ))
    notification_service.create_notification(
        db,
        complaint.citizen_id,
        f"Complaint #{complaint.id} updated",
        f"Your complaint status is now {data.status.replace('_', ' ')}. {data.message.strip()}",
        "complaint",
    )
    db.commit()
    db.refresh(complaint)
    return complaint