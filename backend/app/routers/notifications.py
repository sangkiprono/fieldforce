from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=list[NotificationOut])
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()

@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).count()
    return {"count": count}

@router.patch("/{notification_id}/read")
def mark_read(notification_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"status": "ok"}

@router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"status": "ok"}
