import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False, default="pcs")
    unit_cost = Column(Float, nullable=True)
    total_quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TechnicianStock(Base):
    __tablename__ = "technician_stock"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    technician_id = Column(String, ForeignKey("users.id"), nullable=False)
    item_id = Column(String, ForeignKey("inventory_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    technician = relationship("User", foreign_keys=[technician_id])
    item = relationship("InventoryItem", foreign_keys=[item_id])


class JobMaterial(Base):
    __tablename__ = "job_materials"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    item_id = Column(String, ForeignKey("inventory_items.id"), nullable=False)
    quantity_used = Column(Integer, nullable=False)
    recorded_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    item = relationship("InventoryItem", foreign_keys=[item_id])
