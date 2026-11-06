from pydantic import BaseModel, ConfigDict, Field


class DisposalPointFields(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    address: str = Field(min_length=3, max_length=240)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accepted_waste_types: list[str] = Field(default_factory=list, max_length=20)
    opening_hours: str | None = Field(default=None, max_length=120)
    contact: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=2000)


class DisposalPointCreate(DisposalPointFields):
    pass


class DisposalPointUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    address: str | None = Field(default=None, min_length=3, max_length=240)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    accepted_waste_types: list[str] | None = Field(default=None, max_length=20)
    opening_hours: str | None = Field(default=None, max_length=120)
    contact: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class DisposalPointOut(DisposalPointFields):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool