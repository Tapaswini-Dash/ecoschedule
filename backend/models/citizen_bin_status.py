from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from core.enums import BinFillLevel
from db.base import Base
from models._types import enum_col


class CitizenBinStatus(Base):
    __tablename__ = "citizen_bin_statuses"

    id: Mapped[int] = mapped_column(primary_key=True)
    citizen_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), unique=True, index=True
    )
    fill_level: Mapped[BinFillLevel] = mapped_column(enum_col(BinFillLevel))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
