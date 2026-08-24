from pydantic import BaseModel
from datetime import datetime

class CustomerCreate(BaseModel):
    name: str
    phone: str
    address: str

class CustomerOut(BaseModel):
    id: str
    name: str
    phone: str
    address: str
    created_at: datetime

    class Config:
        from_attributes = True
