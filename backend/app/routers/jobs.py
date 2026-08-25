import random
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.job import Job
from app.models.job_status_history import JobStatusHistory
from app.models.job_note import JobNote
from app.models.job_photo import JobPhoto
from app.models.user import User, UserRole
from app.schemas.job import (
    JobCreate, JobOut, JobAssign, JobStatusUpdate,
    JobNoteCreate, JobNoteOut, JobPhotoOut, JobStatusHistoryOut,
)
from app.auth.dependencies import get_current_user, require_manager
from app.storage.local import save_upload_file
from app.storage.ws_manager import manager as ws_manager

router = APIRouter(prefix="/jobs", tags=["jobs"])

def generate_job_number(db: Session) -> str:
    count = db.query(Job).count() + 1
    return f"JOB-{count:04d}-{random.randint(100,999)}"

@router.post("", response_model=JobOut)
async def create_job(payload: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    job = Job(
        job_number=generate_job_number(db),
        customer_id=payload.customer_id,
        issue_type=payload.issue_type,
        description=payload.description,
        priority=payload.priority,
        scheduled_at=payload.scheduled_at,
        created_by=current_user.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    await ws_manager.broadcast({"type": "job_created", "job_id": job.id})
    return job

@router.get("", response_model=list[JobOut])
def list_jobs(
    status: str | None = None,
    technician_id: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_manager),
):
    query = db.query(Job)
    if status:
        query = query.filter(Job.status == status)
    if technician_id:
        query = query.filter(Job.assigned_technician_id == technician_id)
    return query.order_by(Job.created_at.desc()).all()

@router.get("/mine", response_model=list[JobOut])
def my_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.technician:
        raise HTTPException(status_code=403, detail="Technician access required")
    return db.query(Job).filter(Job.assigned_technician_id == current_user.id).order_by(Job.created_at.desc()).all()

@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.patch("/{job_id}/assign", response_model=JobOut)
async def assign_job(job_id: str, payload: JobAssign, db: Session = Depends(get_db), _=Depends(require_manager)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.assigned_technician_id = payload.technician_id
    job.status = "assigned"
    db.commit()
    db.refresh(job)
    await ws_manager.broadcast({"type": "job_updated", "job_id": job.id, "status": job.status.value})
    return job

@router.patch("/{job_id}/status", response_model=JobOut)
async def update_status(job_id: str, payload: JobStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = payload.status

    if payload.status == "on_site" and payload.latitude is not None and payload.longitude is not None:
        job.checkin_latitude = payload.latitude
        job.checkin_longitude = payload.longitude

    db.add(JobStatusHistory(job_id=job.id, status=payload.status, changed_by=current_user.id, note=payload.note))
    db.commit()
    db.refresh(job)
    await ws_manager.broadcast({"type": "job_updated", "job_id": job.id, "status": job.status.value})
    return job

@router.get("/{job_id}/history", response_model=list[JobStatusHistoryOut])
def job_history(job_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(JobStatusHistory).filter(JobStatusHistory.job_id == job_id).order_by(JobStatusHistory.created_at).all()

@router.post("/{job_id}/notes", response_model=JobNoteOut)
def add_note(job_id: str, payload: JobNoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = JobNote(job_id=job_id, author_id=current_user.id, note=payload.note)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.get("/{job_id}/notes", response_model=list[JobNoteOut])
def list_notes(job_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(JobNote).filter(JobNote.job_id == job_id).order_by(JobNote.created_at).all()

@router.post("/{job_id}/photos", response_model=JobPhotoOut)
async def upload_photo(job_id: str, file: UploadFile = File(...), caption: str | None = Form(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    photo_url = await save_upload_file(file, job_id)
    photo = JobPhoto(job_id=job_id, photo_url=photo_url, caption=caption, uploaded_by=current_user.id)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo

@router.get("/{job_id}/photos", response_model=list[JobPhotoOut])
def list_photos(job_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(JobPhoto).filter(JobPhoto.job_id == job_id).order_by(JobPhoto.created_at).all()
