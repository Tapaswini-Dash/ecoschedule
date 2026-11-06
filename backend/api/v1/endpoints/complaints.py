from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from core.constants import Role
from core.permissions import require_roles
from models.user import User
from schemas.complaint import ComplaintCreate, ComplaintOut, ComplaintStatusUpdate
from services import complaint_service

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("/my", response_model=list[ComplaintOut])
def my_complaints(db: Session = Depends(get_db), user: User = Depends(require_roles(Role.CITIZEN))):
    return complaint_service.list_complaints(db, user.id)


@router.get("", response_model=list[ComplaintOut])
def list_complaints(db: Session = Depends(get_db), _admin: User = Depends(require_roles(Role.ADMIN))):
    return complaint_service.list_complaints(db)


@router.post("", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
def create_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    citizen: User = Depends(require_roles(Role.CITIZEN)),
):
    return complaint_service.create_complaint(db, citizen, data)


@router.patch("/{complaint_id}", response_model=ComplaintOut)
def update_complaint(
    complaint_id: int,
    data: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(Role.ADMIN)),
):
    return complaint_service.update_complaint(db, admin, complaint_id, data)