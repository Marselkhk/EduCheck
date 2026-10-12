from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os

from ..database import get_db
from ..models import Course, Group, Student, User, Material, Submission
from ..schemas import GroupCreate, GroupResponse, StudentInGroup
from ..dependencies import require_teacher, get_current_user

router = APIRouter(prefix="/courses", tags=["groups"])


@router.post("/{course_id}/groups", response_model=GroupResponse)
def create_group(
    course_id: int,
    data: GroupCreate,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Создать группу внутри курса (только препод-владелец)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден")
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    group = Group(
        course_id=course_id,
        name=data.name
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.get("/{course_id}/groups", response_model=list[GroupResponse])
def get_groups(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Получить список групп курса"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден")
    
    groups = db.query(Group).filter(Group.course_id == course_id).all()
    return groups


@router.get("/{course_id}/groups/{group_id}/students", response_model=list[StudentInGroup])
def get_group_students(
    course_id: int,
    group_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Получить список студентов группы"""
    group = db.query(Group).filter(
        Group.id == group_id,
        Group.course_id == course_id
    ).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    students = db.query(Student).filter(Student.group_id == group_id).all()
    
    result = []
    for s in students:
        user = db.query(User).filter(User.id == s.user_id).first()
        result.append(StudentInGroup(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name
        ))
    
    return result


@router.delete("/{course_id}/groups/{group_id}")
def delete_group(
    course_id: int,
    group_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Удалить группу (только препод-владелец)"""
    group = db.query(Group).filter(
        Group.id == group_id,
        Group.course_id == course_id
    ).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    # Удаляем студентов группы
    db.query(Student).filter(Student.group_id == group_id).delete()
    
    # Удаляем материалы группы и их сдачи
    materials = db.query(Material).filter(Material.group_id == group_id).all()
    for material in materials:
        db.query(Submission).filter(Submission.material_id == material.id).delete()
        if material.file_path and os.path.exists(material.file_path):
            os.remove(material.file_path)
        db.delete(material)
    
    # Удаляем группу
    db.delete(group)
    db.commit()
    
    return {"message": "Группа удалена"}
@router.delete("/{course_id}/groups/{group_id}/students/{user_id}")
def remove_student_from_group(
    course_id: int,
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Удалить студента из группы"""
    group = db.query(Group).filter(
        Group.id == group_id,
        Group.course_id == course_id
    ).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    student = db.query(Student).filter(
        Student.user_id == user_id,
        Student.group_id == group_id
    ).first()
    if not student:
        raise HTTPException(404, "Студент не найден в группе")
    
    # Удаляем сдачи студента
    db.query(Submission).filter(Submission.student_id == user_id).delete()
    
    # Удаляем студента из группы
    db.delete(student)
    db.commit()
    
    return {"message": "Студент удалён из группы"}