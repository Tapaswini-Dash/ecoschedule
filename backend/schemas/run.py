from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field

from core.enums import LocationSource, RunStatus, StopStatus
from schemas.schedule import ScheduleOnDate


class RunStart(BaseModel):
    route_id: int
    vehicle_id: int | None = None      # defaults to the vehicle assigned to the route
    collector_id: int | None = None    # admin only; collectors always start their own run


class LocationIn(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class StopStatusIn(BaseModel):
    status: StopStatus
    note: str | None = Field(default=None, max_length=300)


class DelayIn(BaseModel):
    delay_minutes: int = Field(gt=0, le=720)
    reason: str = Field(min_length=3, max_length=300)
    revised_time: time | None = None


class VisitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    stop_id: int
    sequence: int
    stop_name: str
    status: StopStatus
    visited_at: datetime | None
    note: str | None


class RunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    route_id: int
    vehicle_id: int | None
    collector_id: int | None
    run_date: date
    status: RunStatus
    started_at: datetime | None
    ended_at: datetime | None
    delay_minutes: int
    delay_reason: str | None
    delay_revised_time: time | None
    visits: list[VisitOut] = []


class TrackLocation(BaseModel):
    available: bool
    message: str
    latitude: float | None = None
    longitude: float | None = None
    recorded_at: datetime | None = None
    age_minutes: int | None = None
    source: LocationSource | None = None
    is_demo: bool = False


class TrackEta(BaseModel):
    available: bool
    estimated_completion: datetime | None = None
    basis: str


class TrackOut(BaseModel):
    route_id: int
    route_code: str
    zone: str
    vehicle_registration: str | None = None
    vehicle_type: str | None = None
    run_id: int | None
    run_status: RunStatus
    delay_minutes: int = 0
    delay_reason: str | None = None
    delay_revised_time: time | None = None
    scheduled_today: list[ScheduleOnDate]
    stops_total: int = 0
    stops_completed: int = 0
    stops_missed: int = 0
    location: TrackLocation
    eta: TrackEta
    disclaimer: str
