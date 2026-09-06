from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models.job import Job, JobStatus
from app.models.user import User, UserRole
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

@router.get("/jobs-by-technician")
def jobs_by_technician(db: Session = Depends(get_db), _=Depends(require_manager)):
    technicians = db.query(User).filter(User.role == UserRole.technician).all()
    result = []
    for tech in technicians:
        total = db.query(Job).filter(Job.assigned_technician_id == tech.id).count()
        completed = db.query(Job).filter(
            Job.assigned_technician_id == tech.id,
            Job.status == JobStatus.completed,
        ).count()
        result.append({
            "technician_id": tech.id,
            "technician_name": tech.name,
            "total_jobs": total,
            "completed_jobs": completed,
        })
    return result

@router.get("/jobs-trend")
def jobs_trend(days: int = 14, db: Session = Depends(get_db), _=Depends(require_manager)):
    start_date = datetime.now() - timedelta(days=days)
    jobs = db.query(Job).filter(Job.created_at >= start_date).all()

    daily_counts: dict[str, int] = {}
    for i in range(days):
        day = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_counts[day] = 0

    for job in jobs:
        if job.created_at:
            day = job.created_at.strftime("%Y-%m-%d")
            if day in daily_counts:
                daily_counts[day] += 1

    return [{"date": d, "count": c} for d, c in sorted(daily_counts.items())]

@router.get("/issue-breakdown")
def issue_breakdown(db: Session = Depends(get_db), _=Depends(require_manager)):
    counts = dict(db.query(Job.issue_type, func.count(Job.id)).group_by(Job.issue_type).all())
    return {issue_type.value if hasattr(issue_type, "value") else issue_type: count for issue_type, count in counts.items()}
