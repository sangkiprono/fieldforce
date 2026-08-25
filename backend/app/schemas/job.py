from pydantic import BaseModel
from datetime import datetime
from app.models.job import IssueType, Priority, JobStatus
from app.schemas.customer import CustomerOut
from app.schemas.user import UserOut

class JobCreate(BaseModel):
    customer_id: str
    issue_type: IssueType
    description: str | None = None
    priority: Priority = Priority.medium
    scheduled_at: datetime | None = None

class JobAssign(BaseModel):
    technician_id: str

class JobStatusUpdate(BaseModel):
    status: JobStatus
    note: str | None = None
    latitude: float | None = None
    longitude: float | None = None

class JobOut(BaseModel):
    id: str
    job_number: str
    customer: CustomerOut
    issue_type: IssueType
    description: str | None
    priority: Priority
    status: JobStatus
    assigned_technician: UserOut | None
    scheduled_at: datetime | None
    checkin_latitude: float | None
    checkin_longitude: float | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class JobNoteCreate(BaseModel):
    note: str

class JobNoteOut(BaseModel):
    id: str
    author_id: str
    note: str
    created_at: datetime

    class Config:
        from_attributes = True

class JobPhotoOut(BaseModel):
    id: str
    photo_url: str
    caption: str | None
    uploaded_by: str
    created_at: datetime

    class Config:
        from_attributes = True

class JobStatusHistoryOut(BaseModel):
    id: str
    status: JobStatus
    changed_by: str
    note: str | None
    created_at: datetime

    class Config:
        from_attributes = True
