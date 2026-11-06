from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ComplaintStatus = Literal["open", "in_progress", "resolved", "rejected"]


class ComplaintCreate(BaseModel):
    category: str = Field(min_length=2, max_length=40)
    description: str = Field(min_length=5, max_length=4000)
    route_id: int | None = None


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    message: str = Field(min_length=3, max_length=1000)


class ComplaintUpdateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_id: int
    status: str
    message: str
    created_at: datetime


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    citizen_id: int
    route_id: int | None
    category: str
    description: str
    status: ComplaintStatus
    created_at: datetime
    updated_at: datetime
    updates: list[ComplaintUpdateOut]