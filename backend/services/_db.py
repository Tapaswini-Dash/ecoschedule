from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


def commit_or_409(db: Session, message: str = "Conflicts with existing data") -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=message)


def apply_updates(obj, data) -> None:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
