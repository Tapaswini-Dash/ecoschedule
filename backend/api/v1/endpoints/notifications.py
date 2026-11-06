from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from models.user import User
from schemas.notification import NotificationOut
from services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def my_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return notification_service.list_notifications(db, user.id)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, db: Session = Depends(get_db),
              user: User = Depends(get_current_user)):
    return notification_service.mark_read(db, user.id, notification_id)