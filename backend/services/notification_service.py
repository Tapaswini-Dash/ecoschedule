from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.exceptions import forbidden
from models.notification import Notification


def create_notification(db: Session, user_id: int, title: str, message: str, kind: str) -> Notification:
    notification = Notification(user_id=user_id, title=title, message=message, kind=kind)
    db.add(notification)
    return notification


def list_notifications(db: Session, user_id: int) -> list[Notification]:
    return list(
        db.scalars(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .limit(100)
        )
    )


def mark_read(db: Session, user_id: int, notification_id: int) -> Notification:
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(404, "Notification not found")
    if notification.user_id != user_id:
        raise forbidden()
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification