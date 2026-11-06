from datetime import date, datetime, time

from pydantic import BaseModel

from core.enums import RunStatus
from schemas.run import TrackLocation


class RunListItem(BaseModel):
    id: int
    route_id: int
    route_code: str
    zone: str
    vehicle_id: int | None
    collector_id: int | None
    collector_name: str | None
    run_date: date
    status: RunStatus
    started_at: datetime | None
    ended_at: datetime | None
    delay_minutes: int
    delay_reason: str | None
    stops_total: int
    stops_completed: int
    stops_missed: int
    stops_pending: int


class RunPage(BaseModel):
    items: list[RunListItem]
    total: int
    limit: int
    offset: int


class ActiveRunOut(RunListItem):
    delay_revised_time: time | None
    location: TrackLocation