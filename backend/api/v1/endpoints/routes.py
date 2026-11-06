from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from core.constants import Role
from core.permissions import require_roles
from schemas.route import RouteCreate, RouteOut, RouteUpdate, StopIn, StopOut, StopUpdate
from services import route_service

router = APIRouter(prefix="/routes", tags=["routes"])
admin_only = require_roles(Role.ADMIN)


@router.get("", response_model=list[RouteOut])
def list_routes(zone: str | None = None, active_only: bool = True,
                db: Session = Depends(get_db), user=Depends(get_current_user)):
    return route_service.list_routes(db, zone, active_only)


@router.get("/{route_id}", response_model=RouteOut)
def get_route(route_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return route_service.get_route(db, route_id)


@router.post("", response_model=RouteOut, status_code=201)
def create_route(data: RouteCreate, db: Session = Depends(get_db), user=Depends(admin_only)):
    return route_service.create_route(db, data)


@router.patch("/{route_id}", response_model=RouteOut)
def update_route(route_id: int, data: RouteUpdate, db: Session = Depends(get_db), user=Depends(admin_only)):
    return route_service.update_route(db, route_id, data)


@router.delete("/{route_id}", status_code=204)
def deactivate_route(route_id: int, db: Session = Depends(get_db), user=Depends(admin_only)):
    route_service.deactivate_route(db, route_id)
    return Response(status_code=204)


@router.post("/{route_id}/stops", response_model=StopOut, status_code=201)
def add_stop(route_id: int, data: StopIn, db: Session = Depends(get_db), user=Depends(admin_only)):
    return route_service.add_stop(db, route_id, data)


@router.patch("/stops/{stop_id}", response_model=StopOut)
def update_stop(stop_id: int, data: StopUpdate, db: Session = Depends(get_db), user=Depends(admin_only)):
    return route_service.update_stop(db, stop_id, data)


@router.delete("/stops/{stop_id}", status_code=204)
def delete_stop(stop_id: int, db: Session = Depends(get_db), user=Depends(admin_only)):
    route_service.delete_stop(db, stop_id)
    return Response(status_code=204)
