from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models import Complaint, Submission, Material, Course, User, Notification, Student, ExtraAttempt
from ..dependencies import get_current_user

router = APIRouter(prefix="/complaints", tags=["complaints"])


class ComplaintCreate(BaseModel):
    submission_id: int
    text: str


class ComplaintResponse(BaseModel):
    teacher_response: str
    status: str  # resolved или rejected
    grant_extra_attempt: bool = False  # ← НОВОЕ: дать доп. попытку


class GrantAttemptRequest(BaseModel):
    material_id: int


@router.post("/")
def create_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Студент подаёт жалобу"""
    if user.role != "student":
        raise HTTPException(403, "Только студенты могут подавать жалобы")
    
    submission = db.query(Submission).filter(Submission.id == data.submission_id).first()
    if not submission:
        raise HTTPException(404, "Работа не найдена")
    
    if submission.student_id != user.id:
        raise HTTPException(403, "Это не ваша работа")
    
    if submission.status != "graded":
        raise HTTPException(400, "Работа ещё не оценена")
    
    # Проверяем, нет ли уже жалобы
    existing = db.query(Complaint).filter(
        Complaint.submission_id == data.submission_id,
        Complaint.student_id == user.id
    ).first()
    
    if existing:
        raise HTTPException(400, "Вы уже подали жалобу на эту работу")
    
    material = db.query(Material).filter(Material.id == submission.material_id).first()
    course = db.query(Course).filter(Course.id == material.course_id).first()
    
    complaint = Complaint(
        student_id=user.id,
        submission_id=data.submission_id,
        teacher_id=course.teacher_id,
        text=data.text,
        status="open"
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    
    # Уведомление преподу
    notification = Notification(
        user_id=course.teacher_id,
        title="Новая жалоба",
        message=f"Студент подал жалобу на оценку по работе \"{material.title}\"",
        type="info",
        link="/teacher/complaints"
    )
    db.add(notification)
    db.commit()
    
    return {"message": "Жалоба подана", "id": complaint.id}


@router.get("/my")
def get_my_complaints(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Мои жалобы (студент)"""
    if user.role != "student":
        raise HTTPException(403, "Только для студентов")
    
    complaints = db.query(Complaint).filter(
        Complaint.student_id == user.id
    ).order_by(Complaint.created_at.desc()).all()
    
    result = []
    for c in complaints:
        submission = db.query(Submission).filter(Submission.id == c.submission_id).first()
        material = db.query(Material).filter(Material.id == submission.material_id).first() if submission else None
        
    result.append({
        "id": c.id,
        "submission_id": c.submission_id,
        "text": c.text,
        "status": c.status,
        "teacher_response": c.teacher_response,
        "material_title": material.title if material else "",
        "created_at": c.created_at,
        "resolved_at": c.resolved_at,
    })
    return result


@router.get("/teacher")
def get_teacher_complaints(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Жалобы преподу"""
    if user.role != "teacher":
        raise HTTPException(403, "Только для преподавателей")
    
    complaints = db.query(Complaint).filter(
        Complaint.teacher_id == user.id
    ).order_by(Complaint.created_at.desc()).all()
    
    result = []
    for c in complaints:
        student = db.query(User).filter(User.id == c.student_id).first()
        submission = db.query(Submission).filter(Submission.id == c.submission_id).first()
        material = db.query(Material).filter(Material.id == submission.material_id).first() if submission else None
        
        result.append({
            "id": c.id,
            "student_name": student.full_name if student else "Студент",
            "student_email": student.email if student else "",
            "text": c.text,
            "status": c.status,
            "teacher_response": c.teacher_response,
            "material_title": material.title if material else "",
            "submission_score": submission.score if submission else None,
            "submission_max": material.max_score if material else None,
            "created_at": c.created_at,
            "resolved_at": c.resolved_at,
        })
    
    return result


@router.post("/{complaint_id}/respond")
def respond_to_complaint(
    complaint_id: int,
    data: ComplaintResponse,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Препод отвечает на жалобу + может дать доп. попытку"""
    if user.role != "teacher":
        raise HTTPException(403, "Только для преподавателей")
    
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.teacher_id == user.id
    ).first()
    
    if not complaint:
        raise HTTPException(404, "Жалоба не найдена")
    
    if data.status not in ["resolved", "rejected"]:
        raise HTTPException(400, "Неверный статус")
    
    complaint.teacher_response = data.teacher_response
    complaint.status = data.status
    complaint.resolved_at = datetime.utcnow()
    db.commit()
    
    # Если препод дал доп. попытку
    # Если препод дал доп. попытку
    if data.grant_extra_attempt:
        # Получаем материал из сдачи
        submission = db.query(Submission).filter(
            Submission.id == complaint.submission_id
        ).first()
        
        if submission:
            material = db.query(Material).filter(
                Material.id == submission.material_id
            ).first()
            
            if material:
                # Находим запись студента в группе
                student_record = db.query(Student).filter(
                    Student.user_id == complaint.student_id,
                    Student.group_id == material.group_id
                ).first()
                
            extra_record = db.query(ExtraAttempt).filter(
                ExtraAttempt.student_id == complaint.student_id,
                ExtraAttempt.material_id == material.id
            ).first()

            if extra_record:
                extra_record.extra += 1
            else:
                extra_record = ExtraAttempt(
                    student_id=complaint.student_id,
                    material_id=material.id,
                    extra=1
                )
                db.add(extra_record)
            db.commit()
    
    # Уведомление студенту
    notification_message = f"Преподаватель ответил на вашу жалобу."
    if data.grant_extra_attempt:
        notification_message += " Вам дана дополнительная попытка!"
    
    notification = Notification(
        user_id=complaint.student_id,
        title="Ответ на жалобу",
        message=notification_message,
        type="info",
        link="/student/complaints"
    )
    db.add(notification)
    db.commit()
    
    return {"message": "Ответ отправлен"}