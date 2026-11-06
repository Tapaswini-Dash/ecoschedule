from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.enums import BinFillLevel
from models.citizen_bin_status import CitizenBinStatus


def get_status(db: Session, citizen_id: int) -> CitizenBinStatus | None:
    return db.scalar(
        select(CitizenBinStatus).where(CitizenBinStatus.citizen_id == citizen_id)
    )


def report_status(
    db: Session,
    citizen_id: int,
    fill_level: BinFillLevel,
) -> CitizenBinStatus:
    status = get_status(db, citizen_id)
    if status is None:
        status = CitizenBinStatus(citizen_id=citizen_id, fill_level=fill_level)
        db.add(status)
    else:
        status.fill_level = fill_level
        status.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(status)
    return status
