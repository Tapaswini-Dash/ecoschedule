from pydantic import BaseModel, ConfigDict, Field

from core.constants import Role


class UserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: str
    phone: str | None
    role: Role
    is_active: bool


class UserPage(BaseModel):
    items: list[UserListItem]
    total: int
    limit: int
    offset: int


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=20)
    is_active: bool | None = None