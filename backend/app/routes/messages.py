from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import Message, Group, Course, Student, User
from ..dependencies import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])


class MessageCreate(BaseModel):
    group_id: int
    text: str
    is_forum: bool = False
    parent_id: int | None = None


def check_access(group_id: int, user: User, db: Session):
    """Проверяет, что юзер имеет доступ к группе"""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == group.course_id).first()
    
    if user.role == "teacher":
        if course.teacher_id != user.id:
            raise HTTPException(403, "Это не ваш курс")
    else:
        student = db.query(Student).filter(
            Student.user_id == user.id,
            Student.group_id == group_id
        ).first()
        if not student:
            raise HTTPException(403, "Вы не в этой группе")
    
    return group


@router.get("/{group_id}")
def get_messages(
    group_id: int,
    is_forum: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Получить сообщения группы (чат или форум)"""
    check_access(group_id, user, db)
    
    messages = db.query(Message).filter(
        Message.group_id == group_id,
        Message.is_forum == is_forum
    ).order_by(Message.created_at.asc()).all()
    
    result = []
    for m in messages:
        author = db.query(User).filter(User.id == m.user_id).first()
        result.append({
            "id": m.id,
            "group_id": m.group_id,
            "user_id": m.user_id,
            "user_name": author.full_name if author else "Неизвестный",
            "user_role": author.role if author else "student",
            "parent_id": m.parent_id,
            "text": m.text,
            "is_forum": m.is_forum,
            "created_at": m.created_at,
        })
    
    return result


@router.post("/")
def create_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Отправить сообщение"""
    check_access(data.group_id, user, db)
    
    msg = Message(
        group_id=data.group_id,
        user_id=user.id,
        text=data.text,
        is_forum=data.is_forum,
        parent_id=data.parent_id
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    
    return {
        "id": msg.id,
        "group_id": msg.group_id,
        "user_id": msg.user_id,
        "user_name": user.full_name,
        "user_role": user.role,
        "parent_id": msg.parent_id,
        "text": msg.text,
        "is_forum": msg.is_forum,
        "created_at": msg.created_at,
    }


@router.delete("/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Удалить сообщение (автор или препод)"""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(404, "Сообщение не найдено")
    
    group = db.query(Group).filter(Group.id == msg.group_id).first()
    course = db.query(Course).filter(Course.id == group.course_id).first()
    
    is_author = msg.user_id == user.id
    is_teacher = user.role == "teacher" and course.teacher_id == user.id
    
    if not is_author and not is_teacher:
        raise HTTPException(403, "Нельзя удалить это сообщение")
    
    db.delete(msg)
    db.commit()
    return {"message": "Удалено"}