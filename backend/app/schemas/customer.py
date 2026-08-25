from pydantic import BaseModel
from datetime import datetime

class CustomerCreate(BaseModel):
    name: str
    phone: str
    address: str
    latitude: float | None = None
    longitude: float | None = None

class CustomerOut(BaseModel):
    id: str
    name: str
    phone: str
    address: str
    latitude: float | None
    longitude: float | None
    created_at: datetime

    class Config:
        from_attributes = True
