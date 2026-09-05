from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.job import Job
from app.models.customer import Customer
from app.schemas.job import JobOut

router = APIRouter(prefix="/portal", tags=["customer-portal"])

@router.get("/lookup", response_model=list[JobOut])
def lookup_jobs(
    phone: str = Query(..., description="Customer phone number"),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.phone == phone).first()
    if not customer:
        raise HTTPException(status_code=404, detail="No customer found with that phone number")

    jobs = db.query(Job).filter(Job.customer_id == customer.id).order_by(Job.created_at.desc()).all()
    return jobs
