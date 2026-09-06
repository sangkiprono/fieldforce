from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.inventory import InventoryItem, TechnicianStock, JobMaterial
from app.models.job import Job
from app.models.user import User, UserRole
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemOut, StockAllocate, TechnicianStockOut,
    JobMaterialCreate, JobMaterialOut,
)
from app.auth.dependencies import get_current_user, require_manager
from app.storage.notify import notify

router = APIRouter(prefix="/inventory", tags=["inventory"])

LOW_STOCK_THRESHOLD = 5

@router.post("/items", response_model=InventoryItemOut)
def create_item(payload: InventoryItemCreate, db: Session = Depends(get_db), _=Depends(require_manager)):
    item = InventoryItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/items", response_model=list[InventoryItemOut])
def list_items(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(InventoryItem).order_by(InventoryItem.name).all()

@router.post("/allocate", response_model=TechnicianStockOut)
async def allocate_stock(payload: StockAllocate, db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    item = db.query(InventoryItem).filter(InventoryItem.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.total_quantity < payload.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock in warehouse to allocate")

    stock = db.query(TechnicianStock).filter(
        TechnicianStock.technician_id == payload.technician_id,
        TechnicianStock.item_id == payload.item_id,
    ).first()

    if stock:
        stock.quantity += payload.quantity
    else:
        stock = TechnicianStock(
            technician_id=payload.technician_id,
            item_id=payload.item_id,
            quantity=payload.quantity,
        )
        db.add(stock)

    item.total_quantity -= payload.quantity
    db.commit()
    db.refresh(stock)

    await notify(
        db, payload.technician_id,
        title="Stock allocated",
        message=f"You've received {payload.quantity} {item.unit} of {item.name}",
        link="/technician/stock",
    )

    if item.total_quantity <= LOW_STOCK_THRESHOLD:
        await notify(
            db, current_user.id,
            title="Low warehouse stock",
            message=f"{item.name} is running low ({item.total_quantity} {item.unit} left)",
            link="/manager/inventory",
        )

    return stock

@router.get("/my-stock", response_model=list[TechnicianStockOut])
def my_stock(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.technician:
        raise HTTPException(status_code=403, detail="Technician access required")
    return db.query(TechnicianStock).filter(
        TechnicianStock.technician_id == current_user.id,
        TechnicianStock.quantity > 0,
    ).all()

@router.get("/technician/{technician_id}/stock", response_model=list[TechnicianStockOut])
def technician_stock(technician_id: str, db: Session = Depends(get_db), _=Depends(require_manager)):
    return db.query(TechnicianStock).filter(TechnicianStock.technician_id == technician_id).all()

@router.post("/jobs/{job_id}/materials", response_model=JobMaterialOut)
def record_material_used(job_id: str, payload: JobMaterialCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    stock = db.query(TechnicianStock).filter(
        TechnicianStock.technician_id == current_user.id,
        TechnicianStock.item_id == payload.item_id,
    ).first()

    if not stock or stock.quantity < payload.quantity_used:
        raise HTTPException(status_code=400, detail="Not enough stock to record this usage")

    stock.quantity -= payload.quantity_used

    material = JobMaterial(
        job_id=job_id,
        item_id=payload.item_id,
        quantity_used=payload.quantity_used,
        recorded_by=current_user.id,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material

@router.get("/jobs/{job_id}/materials", response_model=list[JobMaterialOut])
def list_job_materials(job_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(JobMaterial).filter(JobMaterial.job_id == job_id).all()
