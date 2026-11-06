from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from core.constants import Role
from core.permissions import require_roles
from models.user import User
from schemas.auth import LoginRequest, TokenResponse
from schemas.user import StaffCreate, UserCreate, UserOut
from services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """Citizens only. Staff accounts are created by an admin."""
    return auth_service.create_user(db, data, Role.CITIZEN)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    token, user = auth_service.authenticate(db, data.email, data.password)
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/staff", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_staff(
    data: StaffCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.ADMIN)),
):
    return auth_service.create_user(db, data, data.role)