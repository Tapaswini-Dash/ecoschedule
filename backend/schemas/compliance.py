from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ViolationStatus = Literal["open", "under_review", "resolved", "dismissed"]
ViolationSeverity = Literal["low", "medium", "high", "critical"]


class ViolationCreate(BaseModel):
    category: str = Field(min_length=2, max_length=40)
    severity: ViolationSeverity = "medium"
    description: str = Field(min_length=5, max_length=4000)
    route_id: int | None = None


class ViolationUpdate(BaseModel):
    status: ViolationStatus
    resolution: str | None = Field(default=None, max_length=2000)


class ViolationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reported_by_id: int
    route_id: int | None
    category: str
    severity: ViolationSeverity
    description: str
    status: ViolationStatus
    resolution: str | None
    created_at: datetime
    resolved_at: datetime | None