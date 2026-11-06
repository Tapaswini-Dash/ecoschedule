from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from core.constants import Role
from models.user import User
from schemas.user import ProfileUpdate
from schemas.user_admin import UserPage, UserUpdate
from services._db import apply_updates, commit_or_409


def list_users(db: Session, role: Role | None, q: str | None, limit: int, offset: int) -> UserPage:
    filters = []
    if role:
        filters.append(User.role == role)
    if q and q.strip():
        like = f"%{q.strip()}%"
        filters.append(or_(User.full_name.ilike(like), User.email.ilike(like)))
    total = db.scalar(select(func.count()).select_from(User).where(*filters)) or 0
    items = list(db.scalars(
        select(User).where(*filters).order_by(User.id).limit(limit).offset(offset)
    ))
    return UserPage(items=items, total=total, limit=limit, offset=offset)


def update_user(db: Session, actor: User, user_id: int, data: UserUpdate) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    changes = data.model_dump(exclude_unset=True)
    for key in ("full_name", "is_active"):
        if key in changes and changes[key] is None:
            raise HTTPException(422, f"{key} cannot be null")
    if changes.get("is_active") is False and user.id == actor.id:
        raise HTTPException(400, "You cannot deactivate your own account")

    apply_updates(user, data)
    commit_or_409(db, "Could not update user")
    db.refresh(user)
    return user


def update_profile(db: Session, user: User, data: ProfileUpdate) -> User:
    changes = data.model_dump(exclude_unset=True)
    if "full_name" in changes and changes["full_name"] is None:
        raise HTTPException(422, "full_name cannot be null")
    if "full_name" in changes:
        changes["full_name"] = changes["full_name"].strip()
        if len(changes["full_name"]) < 2:
            raise HTTPException(422, "full_name must contain at least 2 non-whitespace characters")
    if changes.get("phone") is not None:
        changes["phone"] = changes["phone"].strip() or None
    for key, value in changes.items():
        setattr(user, key, value)
    commit_or_409(db, "Could not update profile")
    db.refresh(user)
    return user