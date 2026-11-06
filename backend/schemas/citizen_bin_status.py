from datetime import datetime

from pydantic import BaseModel, ConfigDict

from core.enums import BinFillLevel


class CitizenBinStatusUpdate(BaseModel):
    fill_level: BinFillLevel


class CitizenBinStatusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    citizen_id: int
    fill_level: BinFillLevel
    updated_at: datetime
