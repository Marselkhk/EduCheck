from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import random
import string
import os

from ..database import get_db
from ..models import Course, User, Material, Group, Submission, Student
from ..schemas import CourseCreate, CourseResponse
from ..dependencies import require_teacher, get_current_user

router = APIRouter(prefix="/courses", tags=["courses"])


def generate_course_code() -> str:
    """Генерирует код курса из 6 символов"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


@router.post("/", response_model=CourseResponse)
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Создать новый курс (только преподаватель)"""
    while True:
        code = generate_course_code()
        existing = db.query(Course).filter(Course.course_code == code).first()
        if not existing:
            break
    
    course = Course(
        teacher_id=teacher.id,
        title=data.title,
        description=data.description,
        course_code=code,
        max_score=data.max_score,
        auto_threshold=data.auto_threshold,
        admission_threshold=data.admission_threshold,
        planned_lectures=data.planned_lectures,
        planned_labs=data.planned_labs,
        planned_hw=data.planned_hw,
        planned_tests=data.planned_tests
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/my", response_model=list[CourseResponse])
def get_my_courses(
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Получить все курсы текущего преподавателя"""
    courses = db.query(Course).filter(Course.teacher_id == teacher.id).all()
    return courses


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Получить информацию о курсе по ID"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден")
    return course


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Удалить курс (только владелец)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден")
    
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    # Собираем все материалы курса, чтобы удалить их файлы с диска
    materials = db.query(Material).filter(Material.course_id == course_id).all()
    for material in materials:
        if material.file_path and os.path.exists(material.file_path):
            try:
                os.remove(material.file_path)
            except OSError:
                pass  # если файла уже нет — не страшно
    
    # Удаляем курс. SQLAlchemy сам каскадно удалит:
    # groups → students, messages, attendances, curators, materials
    # materials → submissions → complaints, test_results
    # materials → notes, extra_attempts, test_questions, test_results
    db.delete(course)
    db.commit()
    
    return {"message": "Курс удалён"}


from pydantic import BaseModel as PydanticBaseModel


class ExamUpdate(PydanticBaseModel):
    exam_date: str | None = None
    exam_room: str | None = None
    exam_format: str | None = None


@router.put("/{course_id}/exam")
def update_exam(
    course_id: int,
    data: ExamUpdate,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Обновить расписание экзамена"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден")
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    if data.exam_date:
        course.exam_date = datetime.fromisoformat(data.exam_date)
    if data.exam_room is not None:
        course.exam_room = data.exam_room
    if data.exam_format is not None:
        course.exam_format = data.exam_format
    
    db.commit()
    db.refresh(course)
    return course