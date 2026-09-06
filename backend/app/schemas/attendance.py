from pydantic import BaseModel
from datetime import datetime, date

class CheckInRequest(BaseModel):
    latitude: float | None = None
    longitude: float | None = None

class AttendanceOut(BaseModel):
    id: str
    technician_id: str
    date: date
    check_in_time: datetime | None
    check_out_time: datetime | None
    check_in_latitude: float | None
    check_in_longitude: float | None

    class Config:
        from_attributes = True

class TechnicianAttendanceSummary(BaseModel):
    technician_id: str
    technician_name: str
    status: str
    check_in_time: datetime | None
    check_out_time: datetime | None
