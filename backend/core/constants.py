from enum import Enum


class Role(str, Enum):
    ADMIN = "admin"
    COLLECTOR = "collector"
    CITIZEN = "citizen"