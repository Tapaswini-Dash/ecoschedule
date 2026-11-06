"""Development helper: create tables and a first admin. Replace with Alembic migrations before production."""
from sqlalchemy.orm import Session

import models  # noqa: F401  (registers all models on Base.metadata)
from app.config import settings
from core.constants import Role
from db.base import Base
from db.session import engine
from schemas.user import UserCreate
from services import auth_service


def init_db(db: Session) -> None:
    Base.metadata.create_all(bind=engine)
    if not auth_service.get_user_by_email(db, settings.SEED_ADMIN_EMAIL):
        auth_service.create_user(
            db,
            UserCreate(full_name="System Admin", email=settings.SEED_ADMIN_EMAIL, password=settings.SEED_ADMIN_PASSWORD),
            Role.ADMIN,
        )