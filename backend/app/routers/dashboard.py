from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.job import Job, JobStatus
from app.auth.dependencies import require_manager

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
def summary(db: Session = Depends(get_db), _=Depends(require_manager)):
    counts = dict(db.query(Job.status, func.count(Job.id)).group_by(Job.status).all())
    total = db.query(Job).count()
    return {
        "total_jobs": total,
        "by_status": {status.value: counts.get(status.value, 0) for status in JobStatus},
    }
