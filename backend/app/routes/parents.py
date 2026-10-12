from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import ParentLink, User, Student, Course, Group, Material, Submission, Attendance
from ..dependencies import get_current_user

router = APIRouter(prefix="/parents", tags=["parents"])


class LinkRequest(BaseModel):
    student_email: str


def require_parent(user: User = Depends(get_current_user)) -> User:
    if user.role != "parent":
        raise HTTPException(403, "Только для родителей")
    return user


@router.post("/link")
def link_to_student(
    data: LinkRequest,
    db: Session = Depends(get_db),
    parent: User = Depends(require_parent)
):
    """Привязать родителя к ребёнку по email"""
    student = db.query(User).filter(
        User.email == data.student_email,
        User.role == "student"
    ).first()
    
    if not student:
        raise HTTPException(404, "Студент с таким email не найден")
    
    existing = db.query(ParentLink).filter(
        ParentLink.parent_id == parent.id,
        ParentLink.student_id == student.id
    ).first()
    
    if existing:
        raise HTTPException(400, "Уже привязан к этому студенту")
    
    link = ParentLink(parent_id=parent.id, student_id=student.id)
    db.add(link)
    db.commit()
    
    return {
        "message": "Студент привязан",
        "student_id": student.id,
        "student_name": student.full_name
    }


@router.get("/my-children")
def get_my_children(
    db: Session = Depends(get_db),
    parent: User = Depends(require_parent)
):
    """Мои дети"""
    links = db.query(ParentLink).filter(ParentLink.parent_id == parent.id).all()
    
    result = []
    for link in links:
        student = db.query(User).filter(User.id == link.student_id).first()
        if student:
            result.append({
                "id": student.id,
                "full_name": student.full_name,
                "email": student.email,
            })
    
    return result


@router.delete("/unlink/{student_id}")
def unlink_student(
    student_id: int,
    db: Session = Depends(get_db),
    parent: User = Depends(require_parent)
):
    """Отвязать студента"""
    link = db.query(ParentLink).filter(
        ParentLink.parent_id == parent.id,
        ParentLink.student_id == student_id
    ).first()
    
    if not link:
        raise HTTPException(404, "Связь не найдена")
    
    db.delete(link)
    db.commit()
    return {"message": "Отвязано"}


@router.get("/child/{student_id}/overview")
def get_child_overview(
    student_id: int,
    db: Session = Depends(get_db),
    parent: User = Depends(require_parent)
):
    """Обзор успеваемости ребёнка (для родителя)"""
    # Проверка связи
    link = db.query(ParentLink).filter(
        ParentLink.parent_id == parent.id,
        ParentLink.student_id == student_id
    ).first()
    
    if not link:
        raise HTTPException(403, "Это не ваш ребёнок")
    
    student = db.query(User).filter(User.id == student_id).first()
    
    # Все дисциплины ребёнка
    student_records = db.query(Student).filter(Student.user_id == student_id).all()
    
    courses_result = []
    for record in student_records:
        group = db.query(Group).filter(Group.id == record.group_id).first()
        if not group:
            continue
        course = db.query(Course).filter(Course.id == group.course_id).first()
        if not course:
            continue
        
        # Считаем успеваемость
        materials = db.query(Material).filter(
            Material.group_id == group.id,
            Material.type.in_(["lab", "hw", "test"])
        ).all()
        
        total = 0
        max_possible = 0
        labs_done = 0
        labs_total = 0
        hw_done = 0
        hw_total = 0
        tests_done = 0
        tests_total = 0
        
        for m in materials:
            max_possible += m.max_score
            
            if m.type == "lab":
                labs_total += 1
            elif m.type == "hw":
                hw_total += 1
            elif m.type == "test":
                tests_total += 1
            
            submission = db.query(Submission).filter(
                Submission.material_id == m.id,
                Submission.student_id == student_id,
                Submission.status == "graded"
            ).order_by(Submission.submitted_at.desc()).first()
            
            if submission and submission.score is not None:
                total += submission.score
                if m.type == "lab":
                    labs_done += 1
                elif m.type == "hw":
                    hw_done += 1
                elif m.type == "test":
                    tests_done += 1
        
        percentage = round((total / max_possible) * 100, 1) if max_possible > 0 else 0
        
        if percentage >= course.auto_threshold:
            status = "automatic"
        elif percentage >= course.admission_threshold:
            status = "admitted"
        else:
            status = "not_admitted"
        
        # Посещаемость
        attendance = db.query(Attendance).filter(
            Attendance.student_id == student_id,
            Attendance.group_id == group.id
        ).all()
        
        present_count = sum(1 for a in attendance if a.status == "present")
        total_attendance = len(attendance)
        attendance_percentage = round((present_count / total_attendance) * 100, 1) if total_attendance > 0 else 0
        
        courses_result.append({
            "course_title": course.title,
            "group_name": group.name,
            "total_score": total,
            "max_possible": max_possible,
            "percentage": percentage,
            "status": status,
            "auto_threshold": course.auto_threshold,
            "admission_threshold": course.admission_threshold,
            "labs_done": labs_done,
            "labs_total": labs_total,
            "hw_done": hw_done,
            "hw_total": hw_total,
            "tests_done": tests_done,
            "tests_total": tests_total,
            "attendance_percentage": attendance_percentage,
            "attendance_total": total_attendance,
            "exam_date": course.exam_date,
            "exam_room": course.exam_room,
            "exam_format": course.exam_format,
        })
    
    return {
        "student_id": student.id,
        "student_name": student.full_name,
        "student_email": student.email,
        "courses": courses_result,
    }