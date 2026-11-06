from sqlalchemy import select
from sqlalchemy.orm import Session

from core.constants import Role
from core.exceptions import conflict, unauthorized
from core.security import create_access_token, hash_password, verify_password
from models.user import User
from schemas.user import UserCreate


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.strip().lower()))


def create_user(db: Session, data: UserCreate, role: Role = Role.CITIZEN) -> User:
    if get_user_by_email(db, data.email):
        raise conflict("An account with this email already exists")
    user = User(
        full_name=data.full_name.strip(),
        email=data.email.strip().lower(),
        phone=data.phone,
        hashed_password=hash_password(data.password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> tuple[str, User]:
    user = get_user_by_email(db, email)
    # Same error for unknown email and wrong password, so accounts can't be probed.
    if not user or not verify_password(password, user.hashed_password):
        raise unauthorized("Incorrect email or password")
    if not user.is_active:
        raise unauthorized("This account is disabled")
    return create_access_token(user.id, user.role.value), user