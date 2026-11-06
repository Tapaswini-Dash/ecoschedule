from datetime import time

from pydantic import BaseModel, ConfigDict, Field


class StopIn(BaseModel):
    sequence: int = Field(ge=1)
    name: str = Field(min_length=1, max_length=160)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    expected_time: time | None = None


class StopUpdate(BaseModel):
    sequence: int | None = Field(default=None, ge=1)
    name: str | None = Field(default=None, min_length=1, max_length=160)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    expected_time: time | None = None


class StopOut(StopIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    route_id: int


class RouteCreate(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=120)
    zone: str = Field(min_length=1, max_length=80)
    is_active: bool = True
    stops: list[StopIn] = []


class RouteUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=20)
    name: str | None = Field(default=None, min_length=1, max_length=120)
    zone: str | None = Field(default=None, min_length=1, max_length=80)
    is_active: bool | None = None


class RouteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    name: str
    zone: str
    is_active: bool
    is_demo: bool
    stops: list[StopOut] = []
