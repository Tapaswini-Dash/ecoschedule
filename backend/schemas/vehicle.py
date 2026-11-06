from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from core.enums import LocationSource, VehicleStatus


class VehicleCreate(BaseModel):
    registration: str = Field(min_length=1, max_length=30)
    type: str = Field(min_length=1, max_length=40)
    status: VehicleStatus = VehicleStatus.ACTIVE
    assigned_route_id: int | None = None


class VehicleUpdate(BaseModel):
    registration: str | None = Field(default=None, min_length=1, max_length=30)
    type: str | None = Field(default=None, min_length=1, max_length=40)
    status: VehicleStatus | None = None
    assigned_route_id: int | None = None


class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    registration: str
    type: str
    status: VehicleStatus
    assigned_route_id: int | None
    is_demo: bool


class VehicleLocationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    vehicle_id: int
    run_id: int | None
    latitude: float
    longitude: float
    recorded_at: datetime
    source: LocationSource
    is_demo: bool
