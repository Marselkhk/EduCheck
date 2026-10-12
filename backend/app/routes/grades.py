from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Course, Group, Material, Student, Submission, User
from ..dependencies import require_teacher

router = APIRouter(prefix="/grades", tags=["grades"])


@router.get("/group/{group_id}")
def get_group_grades(
    group_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Таблица успеваемости группы (только препод-владелец)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == group.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    # Все оцениваемые материалы
    materials = db.query(Material).filter(
        Material.group_id == group_id,
        Material.type.in_(["lab", "hw", "test"])
    ).all()
    
    max_possible = sum(m.max_score for m in materials)
    
    # Все студенты группы
    students = db.query(Student).filter(Student.group_id == group_id).all()
    
    result = []
    for student_record in students:
        user = db.query(User).filter(User.id == student_record.user_id).first()
        
        total = 0
        for material in materials:
            # Берём ПОСЛЕДНЮЮ оценённую сдачу
            submission = db.query(Submission).filter(
                Submission.material_id == material.id,
                Submission.student_id == student_record.user_id,
                Submission.status == "graded"
            ).order_by(Submission.submitted_at.desc()).first()
            
            if submission and submission.score is not None:
                total += submission.score
        
        percentage = round((total / max_possible) * 100, 1) if max_possible > 0 else 0
        
        result.append({
            "student_id": student_record.id,
            "user_id": student_record.user_id,
            "full_name": user.full_name,
            "email": user.email,
            "status": student_record.status or "not_set",
            "total_score": total,
            "max_possible": max_possible,
            "percentage": percentage,
        })
    
    return {
        "group_id": group.id,
        "group_name": group.name,
        "course_title": course.title,
        "max_possible": max_possible,
        "students": result
    }