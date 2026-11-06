from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class FestivalEventFields(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    description: str | None = Field(default=None, max_length=4000)
    location: str = Field(min_length=2, max_length=240)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    starts_at: datetime
    ends_at: datetime
    waste_plan: str | None = Field(default=None, max_length=4000)

    @model_validator(mode="after")
    def valid_dates_and_coordinates(self):
        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be after starts_at")
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class FestivalEventCreate(FestivalEventFields):
    pass


class FestivalEventUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=140)
    description: str | None = Field(default=None, max_length=4000)
    location: str | None = Field(default=None, min_length=2, max_length=240)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    waste_plan: str | None = Field(default=None, max_length=4000)


class FestivalEventOut(FestivalEventFields):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_by_id: int