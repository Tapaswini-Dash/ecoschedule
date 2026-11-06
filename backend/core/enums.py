from enum import Enum


class VehicleStatus(str, Enum):
    ACTIVE = "active"
    WORKSHOP = "workshop"
    OFF_DUTY = "off_duty"


class LocationSource(str, Enum):
    COLLECTOR = "collector"      # entered by the collector (last reported)
    GPS = "gps"                  # real GPS feed (future)
    SIMULATION = "simulation"    # demo only, never shown as live


class RunStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    DELAYED = "delayed"
    COMPLETED = "completed"


class StopStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    MISSED = "missed"


class BinFillLevel(str, Enum):
    EMPTY = "empty"
    HALF_FULL = "half_full"
    FULL = "full"


class OverrideKind(str, Enum):
    CANCELLED = "cancelled"      # e.g. holiday
    RESCHEDULED = "rescheduled"  # different window on that date
