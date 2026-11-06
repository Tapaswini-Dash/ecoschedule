from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from core.constants import Role
from core.permissions import require_roles
from models.user import User
from schemas.compliance import ViolationCreate, ViolationOut, ViolationUpdate
from services import compliance_service

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/violations", response_model=list[ViolationOut])
def list_violations(db: Session = Depends(get_db), _admin: User = Depends(require_roles(Role.ADMIN))):
    return compliance_service.list_violations(db)


@router.post("/violations", response_model=ViolationOut, status_code=status.HTTP_201_CREATED)
def report_violation(data: ViolationCreate, db: Session = Depends(get_db),
                     reporter: User = Depends(require_roles(Role.ADMIN, Role.COLLECTOR))):
    return compliance_service.report_violation(db, reporter.id, data)


@router.patch("/violations/{violation_id}", response_model=ViolationOut)
def update_violation(violation_id: int, data: ViolationUpdate, db: Session = Depends(get_db),
                     _admin: User = Depends(require_roles(Role.ADMIN))):
    return compliance_service.update_violation(db, violation_id, data)