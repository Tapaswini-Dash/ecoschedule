"""
Sample records for previewing the application. Seeded routes, vehicles, and
schedules retain internal flags for safe identification. Coordinates are
approximate points in Bhubaneswar.

Run from backend/:   python -m db.seed_demo
Seed staff accounts are disabled except for the two demo collectors. Their
generated passwords are printed once when their accounts are created or enabled.
"""
import secrets
from datetime import time, timedelta

from sqlalchemy import or_, select

from app.config import settings
from core.constants import Role
from core.enums import LocationSource, OverrideKind, RunStatus, StopStatus, VehicleStatus
from core.security import hash_password, verify_password
from db.session import SessionLocal
from models.complaint import Complaint
from models.complaint_update import ComplaintUpdate
from models.disposal_point import DisposalPoint
from models.festival_event import FestivalEvent
from models.notification import Notification
from models.route import Route, RouteStop
from models.route_run import RouteRun, StopVisit
from models.schedule import Schedule, ScheduleOverride
from models.user import User
from models.vehicle import Vehicle, VehicleLocation
from models.violation import Violation
from models.waste_facility import WasteFacility
from services.run_service import now_utc, today_ist

DEMO = [
    dict(code="R-01", name="Jaydev Vihar to Saheed Nagar", zone="Ward 12", truck="TRK-101", stops=[
        ("Jaydev Vihar Square", 20.2987, 85.8268, time(6, 30)),
        ("Acharya Vihar", 20.2970, 85.8330, time(7, 0)),
        ("Saheed Nagar Market", 20.2917, 85.8470, time(7, 30)),
        ("Kalpana Square", 20.2780, 85.8450, time(8, 0)),
    ]),
    dict(code="R-02", name="Master Canteen to Unit-1", zone="Ward 7", truck="TRK-102", stops=[
        ("Master Canteen Square", 20.2692, 85.8404, time(6, 30)),
        ("Unit-1 Market", 20.2700, 85.8380, time(7, 0)),
        ("Ram Mandir Road", 20.2650, 85.8350, time(7, 30)),
    ]),
    dict(code="R-03", name="Patia and Infocity", zone="Ward 20", truck="TRK-103", stops=[
        ("Patia Square", 20.3500, 85.8200, time(7, 0)),
        ("Infocity Road", 20.3510, 85.8140, time(7, 30)),
        ("KIIT Road Junction", 20.3560, 85.8170, time(8, 0)),
    ]),
]


def _remove_visible_demo_labels(db) -> bool:
    fields = [
        (User, ("full_name",)),
        (RouteRun, ("delay_reason",)),
        (StopVisit, ("note",)),
        (Complaint, ("description",)),
        (ComplaintUpdate, ("message",)),
        (Violation, ("description", "resolution")),
        (DisposalPoint, ("name", "contact", "description")),
        (WasteFacility, ("name", "contact", "description")),
        (FestivalEvent, ("name", "description")),
        (Notification, ("title", "message")),
        (ScheduleOverride, ("reason",)),
    ]
    changed = False
    for model, attributes in fields:
        marked = or_(*(
            predicate
            for attribute in attributes
            for predicate in (
                getattr(model, attribute).contains("[DEMO]"),
                getattr(model, attribute).like("Demo %"),
            )
        ))
        for row in db.scalars(select(model).where(marked)):
            for attribute in attributes:
                value = getattr(row, attribute)
                if isinstance(value, str):
                    cleaned = value.replace("[DEMO] ", "").replace("Demo ", "")
                    if cleaned != value:
                        setattr(row, attribute, cleaned)
                        changed = True
    return changed


def seed_demo_data(db) -> bool:
    created = _remove_visible_demo_labels(db)
    collector_passwords = {
        "rashmi@gmail.com": settings.DEMO_COLLECTOR_RASHMI_PASSWORD,
        "Mehta@gmail.com": settings.DEMO_COLLECTOR_MEHTA_PASSWORD,
    }
    generated_collector_passwords = {}

    demo_users = [
        ("Operations Admin", "demo.admin@example.invalid", Role.ADMIN),
        ("R. Das", "demo.collector.01@example.invalid", Role.COLLECTOR),
        ("S. Behera", "demo.collector.02@example.invalid", Role.COLLECTOR),
        ("A. Patnaik", "demo.resident@example.invalid", Role.CITIZEN),
        ("R.Dash", "rashmi@gmail.com", Role.COLLECTOR),
        ("M.Sharma", "Mehta@gmail.com", Role.COLLECTOR),
    ]
    users = {}
    for name, email, role in demo_users:
        user = db.scalar(select(User).where(User.email == email))
        configured_password = collector_passwords.get(email)
        if user is None:
            is_demo_collector = email in collector_passwords
            password = configured_password or (
                secrets.token_urlsafe(24) if is_demo_collector else "disabled-demo-account"
            )
            user = User(
                full_name=name,
                email=email,
                hashed_password=hash_password(password),
                role=role,
                is_active=is_demo_collector,
            )
            db.add(user)
            db.flush()
            created = True
            if is_demo_collector and configured_password is None:
                generated_collector_passwords[email] = password
        elif user.role != role:
            raise ValueError(f"Cannot seed demo user: {email} already has a different role.")
        elif email in collector_passwords:
            if configured_password is not None:
                if not verify_password(configured_password, user.hashed_password):
                    user.hashed_password = hash_password(configured_password)
                    created = True
                if not user.is_active:
                    user.is_active = True
                    created = True
            elif not user.is_active and verify_password("disabled-demo-account", user.hashed_password):
                password = secrets.token_urlsafe(24)
                user.hashed_password = hash_password(password)
                user.is_active = True
                generated_collector_passwords[email] = password
                created = True
        users[email] = user

    routes = {}
    vehicles = {}
    for d in DEMO:
        route = db.scalar(select(Route).where(Route.code == d["code"]))
        if route is not None and not route.is_demo:
            raise ValueError(f"Cannot seed demo route: route code {d['code']} is already in use.")
        if route is None:
            route = Route(code=d["code"], name=d["name"], zone=d["zone"], is_demo=True)
            route.stops = [
                RouteStop(sequence=i, name=n, latitude=la, longitude=lo, expected_time=t)
                for i, (n, la, lo, t) in enumerate(d["stops"], start=1)
            ]
            db.add(route)
            db.flush()
            created = True
        elif not route.stops:
            route.stops = [
                RouteStop(sequence=i, name=n, latitude=la, longitude=lo, expected_time=t)
                for i, (n, la, lo, t) in enumerate(d["stops"], start=1)
            ]
            created = True
        routes[d["code"]] = route

        vehicle = db.scalar(select(Vehicle).where(Vehicle.registration == d["truck"]))
        if vehicle is not None and not vehicle.is_demo:
            raise ValueError(f"Cannot seed demo vehicle: registration {d['truck']} is already in use.")
        if vehicle is None:
            vehicle = Vehicle(
                registration=d["truck"], type="Compactor", status=VehicleStatus.ACTIVE,
                assigned_route_id=route.id, is_demo=True,
            )
            db.add(vehicle)
            db.flush()
            created = True
        vehicles[d["truck"]] = vehicle

        combined_days = [1, 4]
        combined_start = time(6, 0)
        combined_end = time(9, 0)
        existing_stream_schedules = list(db.scalars(select(Schedule).where(
            Schedule.route_id == route.id,
            Schedule.is_demo.is_(True),
            Schedule.waste_type.in_(("wet", "dry", "wet_and_dry")),
        )))
        combined_schedule = next(
            (schedule for schedule in existing_stream_schedules if schedule.waste_type == "wet_and_dry"),
            None,
        ) or next(
            (schedule for schedule in existing_stream_schedules if schedule.waste_type == "wet"),
            None,
        ) or next(iter(existing_stream_schedules), None)

        if combined_schedule is None:
            combined_schedule = Schedule(
                route_id=route.id,
                days_of_week=combined_days,
                waste_type="wet_and_dry",
                window_start=combined_start,
                window_end=combined_end,
                is_demo=True,
            )
            db.add(combined_schedule)
            created = True
        else:
            schedule_values = {
                "days_of_week": combined_days,
                "waste_type": "wet_and_dry",
                "window_start": combined_start,
                "window_end": combined_end,
                "is_active": True,
            }
            if any(getattr(combined_schedule, key) != value for key, value in schedule_values.items()):
                for key, value in schedule_values.items():
                    setattr(combined_schedule, key, value)
                created = True

        for schedule in existing_stream_schedules:
            if schedule.id != combined_schedule.id and schedule.is_active:
                schedule.is_active = False
                created = True

    db.flush()
    run_specs = [
        ("R-01", "TRK-101", "demo.collector.01@example.invalid", RunStatus.IN_PROGRESS, [StopStatus.COMPLETED, StopStatus.IN_PROGRESS, StopStatus.PENDING, StopStatus.PENDING]),
        ("R-02", "TRK-102", "demo.collector.02@example.invalid", RunStatus.DELAYED, [StopStatus.COMPLETED, StopStatus.PENDING, StopStatus.PENDING]),
        ("R-03", "TRK-103", "demo.collector.01@example.invalid", RunStatus.COMPLETED, [StopStatus.COMPLETED, StopStatus.COMPLETED, StopStatus.COMPLETED]),
    ]
    now = now_utc()
    for code, truck, collector_email, status, visit_statuses in run_specs:
        route = routes[code]
        run = db.scalar(select(RouteRun).where(
            RouteRun.route_id == route.id,
            RouteRun.run_date == today_ist(),
            RouteRun.collector_id == users[collector_email].id,
        ))
        if run is None:
            existing = db.scalar(select(RouteRun.id).where(
                RouteRun.route_id == route.id,
                RouteRun.run_date == today_ist(),
            ).limit(1))
            if existing:
                continue
            run = RouteRun(
                route_id=route.id,
                vehicle_id=vehicles[truck].id,
                collector_id=users[collector_email].id,
                run_date=today_ist(),
                status=status,
                started_at=now - timedelta(minutes=45),
                ended_at=now - timedelta(minutes=5) if status == RunStatus.COMPLETED else None,
                delay_minutes=25 if status == RunStatus.DELAYED else 0,
                delay_reason="Traffic delay" if status == RunStatus.DELAYED else "Route operations",
            )
            db.add(run)
            db.flush()
            created = True
        for stop, visit_status in zip(route.stops, visit_statuses):
            exists = db.scalar(select(StopVisit.id).where(
                StopVisit.run_id == run.id, StopVisit.stop_id == stop.id,
            ).limit(1))
            if exists:
                continue
            db.add(StopVisit(
                run_id=run.id,
                stop_id=stop.id,
                status=visit_status,
                visited_at=now - timedelta(minutes=20) if visit_status == StopStatus.COMPLETED else None,
                note="Collection completed" if visit_status == StopStatus.COMPLETED else None,
            ))
            created = True

        if run.status in (RunStatus.IN_PROGRESS, RunStatus.DELAYED) and run.vehicle_id and route.stops:
            db.flush()
            visits_by_stop = {
                visit.stop_id: visit
                for visit in db.scalars(select(StopVisit).where(StopVisit.run_id == run.id))
            }
            next_index = next(
                (
                    index for index, stop in enumerate(route.stops)
                    if visits_by_stop.get(stop.id)
                    and visits_by_stop[stop.id].status in (StopStatus.PENDING, StopStatus.IN_PROGRESS)
                ),
                len(route.stops) - 1,
            )
            previous_index = max(next_index - 1, 0)
            previous_stop = route.stops[previous_index]
            next_stop = route.stops[next_index]
            latitude = (previous_stop.latitude + next_stop.latitude) / 2
            longitude = (previous_stop.longitude + next_stop.longitude) / 2
            sample_location = db.scalar(
                select(VehicleLocation)
                .where(
                    VehicleLocation.run_id == run.id,
                    VehicleLocation.source == LocationSource.SIMULATION,
                )
                .order_by(VehicleLocation.recorded_at.desc())
                .limit(1)
            )
            if sample_location is None:
                db.add(VehicleLocation(
                    vehicle_id=run.vehicle_id,
                    run_id=run.id,
                    latitude=latitude,
                    longitude=longitude,
                    recorded_at=now_utc(),
                    source=LocationSource.SIMULATION,
                    is_demo=True,
                ))
                created = True
            else:
                sample_location.vehicle_id = run.vehicle_id
                sample_location.latitude = latitude
                sample_location.longitude = longitude
                sample_location.recorded_at = now_utc()
                sample_location.is_demo = True
                created = True

    resident_id = users["demo.resident@example.invalid"].id
    admin_id = users["demo.admin@example.invalid"].id
    collector_id = users["demo.collector.01@example.invalid"].id
    complaints = [
        ("Missed collection near Saheed Nagar Market", "missed_collection", "open", "R-01", 1),
        ("Overflowing community bin at Unit-1", "overflowing_bin", "in_progress", "R-02", 2),
        ("Request for segregated pickup", "collection_request", "resolved", "R-03", 3),
    ]
    for description, category, status, route_code, days_ago in complaints:
        complaint = db.scalar(select(Complaint).where(Complaint.description == description))
        if complaint is None:
            complaint = Complaint(
                citizen_id=resident_id,
                route_id=routes[route_code].id,
                category=category,
                description=description,
                status=status,
                created_at=now - timedelta(days=days_ago),
                updated_at=now - timedelta(days=max(days_ago - 1, 0)),
            )
            db.add(complaint)
            db.flush()
            db.add(ComplaintUpdate(
                complaint_id=complaint.id,
                author_id=admin_id,
                status=status,
                message=f"Case marked {status.replace('_', ' ')}.",
            ))
            created = True

    violation_specs = [
        ("Waste segregation warning — Ward 12", "segregation", "medium", "open", "R-01", 0),
        ("Collection timing review — Ward 7", "service_timing", "low", "resolved", "R-02", 1),
    ]
    for description, category, severity, status, route_code, days_ago in violation_specs:
        if not db.scalar(select(Violation.id).where(Violation.description == description).limit(1)):
            db.add(Violation(
                reported_by_id=collector_id,
                route_id=routes[route_code].id,
                category=category,
                severity=severity,
                description=description,
                status=status,
                resolution="Reviewed by municipal operations." if status == "resolved" else None,
                created_at=now - timedelta(days=days_ago),
                resolved_at=now - timedelta(days=days_ago) if status == "resolved" else None,
            ))
            created = True

    disposal_points = [
        ("Patia Community Recycling Point", "Patia Square, Bhubaneswar", 20.3500, 85.8200, ["dry", "plastic", "paper"]),
        ("Unit-1 Organic Drop-off", "Unit-1 Market, Bhubaneswar", 20.2700, 85.8380, ["wet", "organic"]),
    ]
    for name, address, latitude, longitude, accepted in disposal_points:
        if not db.scalar(select(DisposalPoint.id).where(DisposalPoint.name == name).limit(1)):
            db.add(DisposalPoint(
                name=name, address=address, latitude=latitude, longitude=longitude,
                accepted_waste_types=accepted, opening_hours="Daily, 7:00 AM–7:00 PM",
                contact="Municipal information", description="Municipal disposal location.",
            ))
            created = True

    facilities = [
        ("Bhubaneswar Materials Recovery Facility", "recycling", "Mancheswar Industrial Estate", 20.325, 85.835, 120.0),
        ("Kalinga Organic Processing Centre", "composting", "Mancheswar, Bhubaneswar", 20.331, 85.842, 80.0),
    ]
    for name, facility_type, address, latitude, longitude, capacity in facilities:
        if not db.scalar(select(WasteFacility.id).where(WasteFacility.name == name).limit(1)):
            db.add(WasteFacility(
                name=name, facility_type=facility_type, address=address,
                latitude=latitude, longitude=longitude, capacity_tonnes=capacity,
                contact="Municipal information", description="Waste processing facility.",
            ))
            created = True

    event_name = "Saheed Nagar Community Clean-up"
    if not db.scalar(select(FestivalEvent.id).where(FestivalEvent.name == event_name).limit(1)):
        starts_at = (now + timedelta(days=7)).replace(hour=7, minute=0, second=0, microsecond=0)
        db.add(FestivalEvent(
            created_by_id=admin_id, name=event_name,
            description="Community clean-up and waste segregation drive.",
            location="Saheed Nagar Market, Bhubaneswar",
            latitude=20.2917, longitude=85.8470,
            starts_at=starts_at, ends_at=starts_at + timedelta(hours=4),
            waste_plan="Separate wet, dry, and recyclable materials; arrange dedicated collection.",
        ))
        created = True

    for email, title, kind in [
        ("demo.collector.01@example.invalid", "Route R-01 assignment", "route"),
        ("demo.collector.02@example.invalid", "Route R-02 delay notice", "route"),
    ]:
        user_id = users[email].id
        if not db.scalar(select(Notification.id).where(
            Notification.user_id == user_id, Notification.title == title,
        ).limit(1)):
            db.add(Notification(
                user_id=user_id, title=title,
                message="Route operations notification.",
                kind=kind, is_read=False,
            ))
            created = True

    reschedule_on = today_ist() + timedelta(days=5)
    while reschedule_on.weekday() not in (1, 4):
        reschedule_on += timedelta(days=1)
    combined_schedule = db.scalar(select(Schedule).where(
        Schedule.route_id == routes["R-01"].id,
        Schedule.waste_type == "wet_and_dry",
        Schedule.is_demo.is_(True),
        Schedule.is_active.is_(True),
    ))
    if combined_schedule and not db.scalar(select(ScheduleOverride.id).where(
        ScheduleOverride.schedule_id == combined_schedule.id,
        ScheduleOverride.on_date == reschedule_on,
    ).limit(1)):
        db.add(ScheduleOverride(
            schedule_id=combined_schedule.id,
            on_date=reschedule_on,
            kind=OverrideKind.RESCHEDULED,
            new_window_start=time(7, 0),
            new_window_end=time(10, 0),
            reason="Community event schedule adjustment.",
        ))
        created = True

    db.commit()
    if generated_collector_passwords:
        print("Generated demo collector sign-in credentials (save these now):")
        for email, password in generated_collector_passwords.items():
            print(f"  {email}: {password}")
    return created


if __name__ == "__main__":
    with SessionLocal() as session:
        print("Sample records updated" if seed_demo_data(session) else "Sample records already present")
