from datetime import datetime, date as date_type
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.attendance import Attendance
from app.models.user import User, UserRole
from app.schemas.attendance import CheckInRequest, AttendanceOut, TechnicianAttendanceSummary
from app.auth.dependencies import get_current_user, require_manager

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.post("/check-in", response_model=AttendanceOut)
def check_in(payload: CheckInRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.technician:
        raise HTTPException(status_code=403, detail="Technician access required")

    today = date_type.today()
    existing = db.query(Attendance).filter(
        Attendance.technician_id == current_user.id,
        Attendance.date == today,
    ).first()

    if existing and existing.check_in_time:
        raise HTTPException(status_code=400, detail="Already checked in today")

    if existing:
        existing.check_in_time = datetime.now()
        existing.check_in_latitude = payload.latitude
        existing.check_in_longitude = payload.longitude
        record = existing
    else:
        record = Attendance(
            technician_id=current_user.id,
            date=today,
            check_in_time=datetime.now(),
            check_in_latitude=payload.latitude,
            check_in_longitude=payload.longitude,
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    return record

@router.post("/check-out", response_model=AttendanceOut)
def check_out(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.technician:
        raise HTTPException(status_code=403, detail="Technician access required")

    today = date_type.today()
    record = db.query(Attendance).filter(
        Attendance.technician_id == current_user.id,
        Attendance.date == today,
    ).first()

    if not record or not record.check_in_time:
        raise HTTPException(status_code=400, detail="You haven't checked in today")
    if record.check_out_time:
        raise HTTPException(status_code=400, detail="Already checked out today")

    record.check_out_time = datetime.now()
    db.commit()
    db.refresh(record)
    return record

@router.get("/today", response_model=AttendanceOut | None)
def my_attendance_today(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date_type.today()
    return db.query(Attendance).filter(
        Attendance.technician_id == current_user.id,
        Attendance.date == today,
    ).first()

@router.get("/team-today", response_model=list[TechnicianAttendanceSummary])
def team_attendance_today(db: Session = Depends(get_db), _=Depends(require_manager)):
    today = date_type.today()
    technicians = db.query(User).filter(User.role == UserRole.technician).all()
    result = []

    for tech in technicians:
        record = db.query(Attendance).filter(
            Attendance.technician_id == tech.id,
            Attendance.date == today,
        ).first()

        if not record or not record.check_in_time:
            status = "absent"
        elif record.check_in_time and not record.check_out_time:
            status = "checked_in"
        else:
            status = "checked_out"

        result.append(TechnicianAttendanceSummary(
            technician_id=tech.id,
            technician_name=tech.name,
            status=status,
            check_in_time=record.check_in_time if record else None,
            check_out_time=record.check_out_time if record else None,
        ))

    return result
