from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from core.enums import OverrideKind


def _check_days(v: list[int]) -> list[int]:
    if not v or any(d < 0 or d > 6 for d in v):
        raise ValueError("days_of_week must be a non-empty list of 0 (Mon) to 6 (Sun)")
    return sorted(set(v))


class ScheduleCreate(BaseModel):
    route_id: int
    days_of_week: list[int]
    window_start: time
    window_end: time
    waste_type: str = Field(min_length=1, max_length=30)  # configurable code
    valid_from: date | None = None
    valid_to: date | None = None
    is_active: bool = True

    @field_validator("days_of_week")
    @classmethod
    def _days(cls, v):
        return _check_days(v)

    @model_validator(mode="after")
    def _window(self):
        if self.window_end <= self.window_start:
            raise ValueError("window_end must be after window_start")
        if self.valid_from and self.valid_to and self.valid_to < self.valid_from:
            raise ValueError("valid_to must not be before valid_from")
        return self


class ScheduleUpdate(BaseModel):
    days_of_week: list[int] | None = None
    window_start: time | None = None
    window_end: time | None = None
    waste_type: str | None = Field(default=None, min_length=1, max_length=30)
    valid_from: date | None = None
    valid_to: date | None = None
    is_active: bool | None = None

    @field_validator("days_of_week")
    @classmethod
    def _d(cls, v):
        return None if v is None else _check_days(v)


class OverrideCreate(BaseModel):
    schedule_id: int
    on_date: date
    kind: OverrideKind
    new_window_start: time | None = None
    new_window_end: time | None = None
    reason: str = Field(min_length=1, max_length=200)

    @model_validator(mode="after")
    def _resched(self):
        if self.kind == OverrideKind.RESCHEDULED:
            if not (self.new_window_start and self.new_window_end):
                raise ValueError("rescheduled override needs new_window_start and new_window_end")
            if self.new_window_end <= self.new_window_start:
                raise ValueError("new_window_end must be after new_window_start")
        return self


class OverrideOut(OverrideCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ScheduleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    route_id: int
    route_code: str
    zone: str
    days_of_week: list[int]
    window_start: time
    window_end: time
    waste_type: str
    valid_from: date | None
    valid_to: date | None
    is_active: bool
    is_demo: bool
    overrides: list[OverrideOut] = []


class ScheduleOnDate(BaseModel):
    schedule_id: int
    waste_type: str
    window_start: time | None
    window_end: time | None
    cancelled: bool
    note: str | None = None
