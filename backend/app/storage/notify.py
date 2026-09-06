from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.storage.ws_manager import manager as ws_manager

async def notify(db: Session, user_id: str, title: str, message: str, link: str | None = None):
    notification = Notification(user_id=user_id, title=title, message=message, link=link)
    db.add(notification)
    db.commit()
    db.refresh(notification)

    await ws_manager.broadcast({
        "type": "notification",
        "user_id": user_id,
        "notification": {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "link": notification.link,
            "created_at": notification.created_at.isoformat(),
        },
    })
    return notification
