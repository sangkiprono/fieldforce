from pydantic import BaseModel
from datetime import datetime

class InventoryItemCreate(BaseModel):
    name: str
    unit: str = "pcs"
    unit_cost: float | None = None
    total_quantity: int = 0

class InventoryItemOut(BaseModel):
    id: str
    name: str
    unit: str
    unit_cost: float | None
    total_quantity: int
    created_at: datetime

    class Config:
        from_attributes = True

class StockAllocate(BaseModel):
    technician_id: str
    item_id: str
    quantity: int

class TechnicianStockOut(BaseModel):
    id: str
    technician_id: str
    item_id: str
    item: InventoryItemOut
    quantity: int
    updated_at: datetime

    class Config:
        from_attributes = True

class JobMaterialCreate(BaseModel):
    item_id: str
    quantity_used: int

class JobMaterialOut(BaseModel):
    id: str
    job_id: str
    item_id: str
    item: InventoryItemOut
    quantity_used: int
    recorded_by: str
    created_at: datetime

    class Config:
        from_attributes = True
