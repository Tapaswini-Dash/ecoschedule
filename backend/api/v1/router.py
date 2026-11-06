from fastapi import APIRouter

from api.v1.endpoints import (
    admin_runs, analytics, auth, citizen_bin_status, collections, complaints, compliance, dashboard,
    disposal_points, festival_planning, health, notifications, reports, routes,
    runs, schedules, users, vehicles, waste_facilities,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(routes.router)
api_router.include_router(schedules.router)
api_router.include_router(vehicles.router)
api_router.include_router(collections.router)
api_router.include_router(complaints.router)
api_router.include_router(citizen_bin_status.router)
api_router.include_router(disposal_points.router)
api_router.include_router(waste_facilities.router)
api_router.include_router(festival_planning.router)
api_router.include_router(compliance.router)
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
api_router.include_router(reports.router)
# admin_runs MUST come before runs: /runs/active has to match before /runs/{run_id}
api_router.include_router(admin_runs.router)
api_router.include_router(runs.router)
api_router.include_router(dashboard.router)
api_router.include_router(users.router)