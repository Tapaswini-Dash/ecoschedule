from datetime import date, datetime, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import models  # noqa: F401
from core.constants import Role
from core.enums import RunStatus, StopStatus
from db.base import Base
from models.route import Route, RouteStop
from models.route_run import RouteRun, StopVisit
from models.user import User
from schemas.complaint import ComplaintCreate, ComplaintStatusUpdate
from schemas.compliance import ViolationCreate, ViolationUpdate
from schemas.disposal_point import DisposalPointCreate
from schemas.festival_event import FestivalEventCreate
from schemas.waste_facility import WasteFacilityCreate
from schemas.user import ProfileUpdate, UserCreate
from services import (
    analytics_service,
    collection_service,
    complaint_service,
    compliance_service,
    disposal_point_service,
    facility_service,
    festival_service,
    notification_service,
    user_service,
)


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    engine.dispose()


def create_user(db: Session, email: str, role: Role) -> User:
    user = User(full_name=email.split("@")[0], email=email, hashed_password="not-used", role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_profile_update_only_changes_allowed_contact_fields(db: Session):
    citizen = create_user(db, "citizen@example.com", Role.CITIZEN)

    updated = user_service.update_profile(
        db,
        citizen,
        ProfileUpdate(full_name="  Citizen User  ", phone="  123456  "),
    )
    assert updated.full_name == "Citizen User"
    assert updated.phone == "123456"
    assert updated.email == "citizen@example.com"
    assert updated.role == Role.CITIZEN

    with pytest.raises(HTTPException) as error:
        user_service.update_profile(db, citizen, ProfileUpdate(full_name="   "))
    assert error.value.status_code == 422


def test_new_citizen_can_sign_in_with_case_or_whitespace_around_email(db: Session, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg2://test:test@localhost:5432/test")
    monkeypatch.setenv("SECRET_KEY", "unit-test-secret-key-that-is-not-used-for-real-auth")
    monkeypatch.setenv("SEED_ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("SEED_ADMIN_PASSWORD", "unit-test-password-that-is-not-used")
    from services import auth_service

    auth_service.create_user(
        db,
        UserCreate(
            full_name="New Citizen",
            email="new.citizen@example.com",
            password="secure-password-123",
        ),
    )

    token, user = auth_service.authenticate(
        db,
        "  New.Citizen@Example.com  ",
        "secure-password-123",
    )

    assert token
    assert user.email == "new.citizen@example.com"
    assert user.role == Role.CITIZEN


def test_complaint_updates_create_private_notification(db: Session):
    citizen = create_user(db, "citizen@example.com", Role.CITIZEN)
    admin = create_user(db, "admin@example.com", Role.ADMIN)

    complaint = complaint_service.create_complaint(
        db,
        citizen,
        ComplaintCreate(category="missed_collection", description="Collection was missed."),
    )
    updated = complaint_service.update_complaint(
        db,
        admin,
        complaint.id,
        ComplaintStatusUpdate(status="resolved", message="The report was reviewed."),
    )

    assert updated.status == "resolved"
    assert len(updated.updates) == 2
    notification = notification_service.list_notifications(db, citizen.id)[0]
    assert notification.kind == "complaint"
    assert notification.is_read is False

    other_citizen = create_user(db, "other@example.com", Role.CITIZEN)
    with pytest.raises(HTTPException) as error:
        notification_service.mark_read(db, other_citizen.id, notification.id)
    assert error.value.status_code == 403


def test_resource_services_save_records(db: Session):
    admin = create_user(db, "admin@example.com", Role.ADMIN)
    citizen = create_user(db, "citizen@example.com", Role.CITIZEN)
    collector = create_user(db, "collector@example.com", Role.COLLECTOR)

    point = disposal_point_service.create_point(
        db,
        DisposalPointCreate(name="Drop-off", address="1 Main Street", latitude=20, longitude=85),
    )
    facility = facility_service.create_facility(
        db,
        WasteFacilityCreate(name="Recycling plant", facility_type="recycling", address="2 Main Street"),
    )
    event = festival_service.create_event(
        db,
        admin.id,
        FestivalEventCreate(
            name="Community cleanup",
            location="Central square",
            starts_at=datetime(2030, 1, 1, tzinfo=timezone.utc),
            ends_at=datetime(2030, 1, 1, 1, tzinfo=timezone.utc),
        ),
    )
    violation = compliance_service.report_violation(
        db,
        collector.id,
        ViolationCreate(category="safety", description="Unsafe waste handling observed."),
    )
    resolved = compliance_service.update_violation(
        db,
        violation.id,
        ViolationUpdate(status="resolved", resolution="Issue corrected."),
    )

    assert disposal_point_service.list_points(db)[0].id == point.id
    assert facility_service.list_facilities(db)[0].id == facility.id
    assert festival_service.list_events(db)[0].id == event.id
    assert resolved.status == "resolved"
    assert resolved.resolved_at is not None
    assert citizen.role == Role.CITIZEN


def test_collection_and_analytics_use_recorded_run_stops(db: Session):
    collector = create_user(db, "collector@example.com", Role.COLLECTOR)
    route = Route(code="R-TEST", name="Test route", zone="Ward 1")
    stop = RouteStop(sequence=1, name="Test stop", latitude=20, longitude=85)
    route.stops.append(stop)
    db.add(route)
    db.flush()
    run_date = date(2026, 1, 2)
    run = RouteRun(
        route_id=route.id,
        collector_id=collector.id,
        run_date=run_date,
        status=RunStatus.COMPLETED,
    )
    db.add(run)
    db.flush()
    db.add(StopVisit(run_id=run.id, stop_id=stop.id, status=StopStatus.COMPLETED))
    db.commit()

    page = collection_service.list_collections(db, run_date, route.id, StopStatus.COMPLETED, 50, 0)
    report = analytics_service.get_operations_analytics(db, run_date, run_date)

    assert page["total"] == 1
    assert page["items"][0]["stop_name"] == "Test stop"
    assert report.total_collections == 1
    assert report.runs_by_status["completed"] == 1
    assert [item.model_dump() for item in report.collections_by_day] == [
        {"date": run_date, "completed_stops": 1}
    ]
