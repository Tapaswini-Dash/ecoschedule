from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from core.enums import BinFillLevel
from db.base import Base
from models.citizen_bin_status import CitizenBinStatus
from models.user import User
from services.citizen_bin_status_service import get_status, report_status


def test_bin_status_is_private_to_citizen_and_updates_existing_record():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine, tables=[User.__table__, CitizenBinStatus.__table__])

    try:
        with Session(engine) as db:
            citizen = User(
                full_name="Citizen One",
                email="citizen-one@example.test",
                hashed_password="not-a-real-password",
            )
            other_citizen = User(
                full_name="Citizen Two",
                email="citizen-two@example.test",
                hashed_password="not-a-real-password",
            )
            db.add_all([citizen, other_citizen])
            db.commit()

            first_report = report_status(db, citizen.id, BinFillLevel.HALF_FULL)
            first_id = first_report.id
            assert first_report.fill_level == BinFillLevel.HALF_FULL
            assert get_status(db, other_citizen.id) is None

            updated_report = report_status(db, citizen.id, BinFillLevel.FULL)
            assert updated_report.id == first_id
            assert updated_report.fill_level == BinFillLevel.FULL
    finally:
        engine.dispose()
