from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from core.constants import Role
from core.permissions import require_roles
from models.user import User
from schemas.user import ProfileUpdate, UserOut
from schemas.user_admin import UserListItem, UserPage, UserUpdate
from services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.patch("/me", response_model=UserOut)
def update_my_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return user_service.update_profile(db, user, data)


@router.get("", response_model=UserPage)
def list_users(
    role: Role | None = None,
    q: str | None = Query(None, max_length=100),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles(Role.ADMIN)),
):
    return user_service.list_users(db, role, q, limit, offset)


@router.patch("/{user_id}", response_model=UserListItem)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(Role.ADMIN)),
):
    return user_service.update_user(db, admin, user_id, data)