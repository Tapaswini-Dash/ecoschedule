from pydantic import BaseModel, ConfigDict, Field, model_validator


class WasteFacilityFields(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    facility_type: str = Field(min_length=2, max_length=40)
    address: str = Field(min_length=3, max_length=240)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    capacity_tonnes: float | None = Field(default=None, ge=0)
    contact: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=2000)


class WasteFacilityCreate(WasteFacilityFields):
    @model_validator(mode="after")
    def coordinates_are_a_pair(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class WasteFacilityUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    facility_type: str | None = Field(default=None, min_length=2, max_length=40)
    address: str | None = Field(default=None, min_length=3, max_length=240)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    capacity_tonnes: float | None = Field(default=None, ge=0)
    contact: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class WasteFacilityOut(WasteFacilityFields):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool