import uuid
from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
from app.models.job import JobStatus

class JobStatusHistory(Base):
    __tablename__ = "job_status_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    status = Column(Enum(JobStatus), nullable=False)
    changed_by = Column(String, ForeignKey("users.id"), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
