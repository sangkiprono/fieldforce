from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerOut
from app.auth.dependencies import require_manager
from app.storage.geocoding import geocode_address

router = APIRouter(prefix="/customers", tags=["customers"])

@router.post("", response_model=CustomerOut)
async def create_customer(payload: CustomerCreate, db: Session = Depends(get_db), _=Depends(require_manager)):
    lat, lng = payload.latitude, payload.longitude
    if lat is None or lng is None:
        result = await geocode_address(payload.address)
        if result:
            lat, lng = result

    customer = Customer(
        name=payload.name,
        phone=payload.phone,
        address=payload.address,
        latitude=lat,
        longitude=lng,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.get("", response_model=list[CustomerOut])
def list_customers(db: Session = Depends(get_db), _=Depends(require_manager)):
    return db.query(Customer).order_by(Customer.created_at.desc()).all()

@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: str, db: Session = Depends(get_db), _=Depends(require_manager)):
    return db.query(Customer).filter(Customer.id == customer_id).first()
