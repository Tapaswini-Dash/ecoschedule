from datetime import date, datetime, time

from pydantic import BaseModel


class DelayedRunOut(BaseModel):
    run_id: int
    route_id: int
    route_code: str
    delay_minutes: int
    delay_reason: str | None
    delay_revised_time: time | None


class DashboardSummary(BaseModel):
    generated_at: datetime
    today: date                          # Asia/Kolkata
    active_routes: int
    vehicles_by_status: dict[str, int]
    runs_today_by_status: dict[str, int]
    stops_completed: int
    stops_missed: int
    stops_pending: int                   # pending + in_progress
    delayed_runs: list[DelayedRunOut]
    complaints_available: bool
    open_complaints: int