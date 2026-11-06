from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.festival_event import FestivalEvent
from schemas.festival_event import FestivalEventCreate, FestivalEventUpdate


def list_events(db: Session) -> list[FestivalEvent]:
    return list(db.scalars(select(FestivalEvent).order_by(FestivalEvent.starts_at)))


def create_event(db: Session, creator_id: int, data: FestivalEventCreate) -> FestivalEvent:
    event = FestivalEvent(created_by_id=creator_id, **data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update_event(db: Session, event_id: int, data: FestivalEventUpdate) -> FestivalEvent:
    event = db.get(FestivalEvent, event_id)
    if event is None:
        raise HTTPException(404, "Festival event not found")
    changes = data.model_dump(exclude_unset=True)
    start = changes.get("starts_at", event.starts_at)
    end = changes.get("ends_at", event.ends_at)
    if end <= start:
        raise HTTPException(422, "ends_at must be after starts_at")
    latitude = changes.get("latitude", event.latitude)
    longitude = changes.get("longitude", event.longitude)
    if (latitude is None) != (longitude is None):
        raise HTTPException(422, "Latitude and longitude must be provided together")
    for key, value in changes.items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event_id: int) -> None:
    event = db.get(FestivalEvent, event_id)
    if event is None:
        raise HTTPException(404, "Festival event not found")
    db.delete(event)
    db.commit()