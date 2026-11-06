from fastapi import Depends

from app.dependencies import get_current_user
from core.constants import Role
from core.exceptions import forbidden
from models.user import User


def require_roles(*roles: Role):
    """Usage: Depends(require_roles(Role.ADMIN))  or  Depends(require_roles(Role.ADMIN, Role.COLLECTOR))"""
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise forbidden()
        return user
    return checker