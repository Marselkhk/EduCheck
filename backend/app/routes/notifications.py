from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import Notification, User
from ..dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str | None = None
    type: str = "info"
    link: str | None = None


@router.get("/my")
def get_my_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Все уведомления пользователя"""
    notifs = db.query(Notification).filter(
        Notification.user_id == user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    return notifs


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Сколько непрочитанных"""
    count = db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read == False
    ).count()
    
    return {"count": count}


@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Отметить как прочитанное"""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user.id
    ).first()
    
    if not notif:
        raise HTTPException(404, "Уведомление не найдено")
    
    notif.is_read = True
    db.commit()
    return {"message": "Отмечено"}


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Отметить все как прочитанные"""
    db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "Все отмечены"}


@router.post("/create")
def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Создать уведомление (внутренний)"""
    notif = Notification(
        user_id=data.user_id,
        title=data.title,
        message=data.message,
        type=data.type,
        link=data.link
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif 