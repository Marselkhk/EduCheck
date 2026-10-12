from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from ..database import get_db
from ..models import (
    CuratorLink, User, Student, Course, Group, Material, Submission, Attendance
)
from ..dependencies import get_current_user, require_teacher

router = APIRouter(prefix="/curators", tags=["curators"])


def require_curator(user: User = Depends(get_current_user)) -> User:
    if user.role != "curator":
        raise HTTPException(403, "Только для кураторов")
    return user


class LinkCuratorRequest(BaseModel):
    curator_email: EmailStr


@router.post("/groups/{group_id}/link")
def link_curator_to_group(
    group_id: int,
    data: LinkCuratorRequest,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Привязать куратора к группе (только препод-владелец курса)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == group.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    curator = db.query(User).filter(
        User.email == data.curator_email,
        User.role == "curator"
    ).first()
    
    if not curator:
        raise HTTPException(404, "Куратор с таким email не найден")
    
    existing = db.query(CuratorLink).filter(
        CuratorLink.curator_id == curator.id,
        CuratorLink.group_id == group_id
    ).first()
    
    if existing:
        raise HTTPException(400, "Куратор уже привязан к этой группе")
    
    link = CuratorLink(curator_id=curator.id, group_id=group_id)
    db.add(link)
    db.commit()
    
    return {
        "message": "Куратор привязан",
        "curator_id": curator.id,
        "curator_name": curator.full_name
    }


@router.get("/groups/{group_id}")
def get_group_curators(
    group_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Список кураторов группы"""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == group.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    links = db.query(CuratorLink).filter(CuratorLink.group_id == group_id).all()
    
    result = []
    for link in links:
        curator = db.query(User).filter(User.id == link.curator_id).first()
        if curator:
            result.append({
                "id": curator.id,
                "full_name": curator.full_name,
                "email": curator.email,
            })
    
    return result


@router.delete("/{curator_id}/groups/{group_id}")
def unlink_curator(
    curator_id: int,
    group_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Отвязать куратора от группы"""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == group.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    link = db.query(CuratorLink).filter(
        CuratorLink.curator_id == curator_id,
        CuratorLink.group_id == group_id
    ).first()
    
    if not link:
        raise HTTPException(404, "Связь не найдена")
    
    db.delete(link)
    db.commit()
    return {"message": "Отвязано"}


@router.get("/my-groups")
def get_my_groups(
    db: Session = Depends(get_db),
    curator: User = Depends(require_curator)
):
    """Мои группы (для куратора)"""
    links = db.query(CuratorLink).filter(CuratorLink.curator_id == curator.id).all()
    
    result = []
    for link in links:
        group = db.query(Group).filter(Group.id == link.group_id).first()
        if not group:
            continue
        course = db.query(Course).filter(Course.id == group.course_id).first()
        if not course:
            continue
        
        # Считаем студентов
        students_count = db.query(Student).filter(Student.group_id == group.id).count()
        
        result.append({
            "group_id": group.id,
            "group_name": group.name,
            "course_id": course.id,
            "course_title": course.title,
            "course_code": course.course_code,
            "students_count": students_count,
        })
    
    return result


@router.get("/group/{group_id}/overview")
def get_group_overview(
    group_id: int,
    db: Session = Depends(get_db),
    curator: User = Depends(require_curator)
):
    """Обзор группы для куратора"""
    # Проверка связи
    link = db.query(CuratorLink).filter(
        CuratorLink.curator_id == curator.id,
        CuratorLink.group_id == group_id
    ).first()
    
    if not link:
        raise HTTPException(403, "У вас нет доступа к этой группе")
    
    group = db.query(Group).filter(Group.id == group_id).first()
    course = db.query(Course).filter(Course.id == group.course_id).first()
    
    # Студенты
    students = db.query(Student).filter(Student.group_id == group_id).all()
    
    students_result = []
    for s in students:
        user = db.query(User).filter(User.id == s.user_id).first()
        if not user:
            continue
        
        # Считаем успеваемость
        materials = db.query(Material).filter(
            Material.group_id == group_id,
            Material.type.in_(["lab", "hw", "test"])
        ).all()
        
        total = 0
        max_possible = 0
        
        for m in materials:
            max_possible += m.max_score
            submission = db.query(Submission).filter(
                Submission.material_id == m.id,
                Submission.student_id == user.id,
                Submission.status == "graded"
            ).order_by(Submission.submitted_at.desc()).first()
            if submission and submission.score is not None:
                total += submission.score
        
        percentage = round((total / max_possible) * 100, 1) if max_possible > 0 else 0
        
        # Посещаемость
        attendance = db.query(Attendance).filter(
            Attendance.student_id == user.id,
            Attendance.group_id == group_id
        ).all()
        present_count = sum(1 for a in attendance if a.status == "present")
        attendance_percentage = round((present_count / len(attendance)) * 100, 1) if attendance else 0
        
        # Статус
        if percentage >= course.auto_threshold:
            status = "automatic"
        elif percentage >= course.admission_threshold:
            status = "admitted"
        else:
            status = "not_admitted"
        
        students_result.append({
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "total_score": total,
            "max_possible": max_possible,
            "percentage": percentage,
            "status": status,
            "attendance_percentage": attendance_percentage,
        })
    
    return {
        "group_id": group.id,
        "group_name": group.name,
        "course_title": course.title,
        "auto_threshold": course.auto_threshold,
        "admission_threshold": course.admission_threshold,
        "students": students_result,
    }