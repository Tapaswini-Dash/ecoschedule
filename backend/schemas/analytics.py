from datetime import date

from pydantic import BaseModel


class DailyCollections(BaseModel):
    date: date
    completed_stops: int


class OperationsAnalytics(BaseModel):
    start_date: date
    end_date: date
    runs_by_status: dict[str, int]
    stops_by_status: dict[str, int]
    complaints_by_status: dict[str, int]
    violations_by_status: dict[str, int]
    active_routes: int
    active_vehicles: int
    total_collections: int
    collections_by_day: list[DailyCollections]