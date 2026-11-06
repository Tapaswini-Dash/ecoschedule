from pydantic import BaseModel, ConfigDict, EmailStr, Field

from core.constants import Role


class UserCreate(BaseModel):
    """Public self-registration. Role is NOT accepted here: it is always 'citizen'."""
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    password: str = Field(min_length=8, max_length=72)


class StaffCreate(UserCreate):
    """Admin-only: create collectors or other admins."""
    role: Role


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=20)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    phone: str | None
    role: Role
    is_active: bool
