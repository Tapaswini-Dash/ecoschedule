from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from core.constants import Role
from core.enums import StopStatus
from core.permissions import require_roles
from schemas.collection import CollectionPage
from services import collection_service

router = APIRouter(
    prefix="/collections",
    tags=["collections"],
    dependencies=[Depends(require_roles(Role.ADMIN))],
)


@router.get("", response_model=CollectionPage)
def list_collections(
    on_date: date | None = Query(None, alias="date"),
    route_id: int | None = None,
    status: StopStatus | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return collection_service.list_collections(db, on_date, route_id, status, limit, offset)