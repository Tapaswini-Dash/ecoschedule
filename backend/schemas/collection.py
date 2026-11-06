from datetime import date, datetime

from pydantic import BaseModel

from core.enums import RunStatus, StopStatus


class CollectionRecord(BaseModel):
    run_id: int
    route_id: int
    route_code: str
    zone: str
    stop_id: int
    stop_name: str
    sequence: int
    collector_id: int | None
    run_date: date
    run_status: RunStatus
    stop_status: StopStatus
    visited_at: datetime | None
    note: str | None


class CollectionPage(BaseModel):
    items: list[CollectionRecord]
    total: int
    limit: int
    offset: int