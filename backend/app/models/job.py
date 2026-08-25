import uuid
import enum
from sqlalchemy import Column, String, Text, DateTime, Float, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class IssueType(str, enum.Enum):
    no_connectivity = "no_connectivity"
    slow_speed = "slow_speed"
    new_installation = "new_installation"
    router_swap = "router_swap"
    other = "other"

class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class JobStatus(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    en_route = "en_route"
    on_site = "on_site"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_number = Column(String, unique=True, nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    issue_type = Column(Enum(IssueType), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(Priority), default=Priority.medium)
    status = Column(Enum(JobStatus), default=JobStatus.pending)
    assigned_technician_id = Column(String, ForeignKey("users.id"), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    checkin_latitude = Column(Float, nullable=True)
    checkin_longitude = Column(Float, nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", foreign_keys=[customer_id])
    assigned_technician = relationship("User", foreign_keys=[assigned_technician_id])
    creator = relationship("User", foreign_keys=[created_by])
