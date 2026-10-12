from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models import Attendance, User, Group, Course, Student, Material, Submission
from ..dependencies import require_teacher, require_student, get_current_user

router = APIRouter(prefix="/attendance", tags=["attendance"])


class AttendanceMark(BaseModel):
    student_id: int
    group_id: int
    date: str
    status: str  # present, absent, late, excused
    note: str | None = None


@router.post("/mark")
def mark_attendance(
    data: AttendanceMark,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Отметить посещаемость"""
    group = db.query(Group).filter(Group.id == data.group_id).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == group.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    date = datetime.fromisoformat(data.date)
    
    # Проверяем, есть ли уже запись за эту дату
    existing = db.query(Attendance).filter(
        Attendance.student_id == data.student_id,
        Attendance.group_id == data.group_id,
        Attendance.date == date
    ).first()
    
    if existing:
        existing.status = data.status
        existing.note = data.note
        db.commit()
        return {"message": "Отметка обновлена"}
    
    attendance = Attendance(
        student_id=data.student_id,
        group_id=data.group_id,
        date=date,
        status=data.status,
        note=data.note
    )
    db.add(attendance)
    db.commit()
    return {"message": "Отмечено"}


@router.get("/group/{group_id}")
def get_group_attendance(
    group_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Посещаемость группы (для препода)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == group.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    records = db.query(Attendance).filter(
        Attendance.group_id == group_id
    ).order_by(Attendance.date.desc()).all()
    
    result = []
    for r in records:
        student = db.query(User).filter(User.id == r.student_id).first()
        result.append({
            "id": r.id,
            "student_id": r.student_id,
            "student_name": student.full_name if student else "—",
            "date": r.date,
            "status": r.status,
            "note": r.note,
        })
    
    return result


@router.get("/student/{student_id}/group/{group_id}")
def get_student_diary(
    student_id: int,
    group_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Дневник студента (посещаемость + сдачи)"""
    # Проверка доступа
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == group.course_id).first()
    
    if user.role == "student" and user.id != student_id:
        raise HTTPException(403, "Это не ваш дневник")
    
    if user.role == "teacher" and course.teacher_id != user.id:
        raise HTTPException(403, "Это не ваш курс")
    
    # Посещаемость
    attendance = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.group_id == group_id
    ).order_by(Attendance.date.desc()).all()
    
    attendance_result = []
    for a in attendance:
        attendance_result.append({
            "date": a.date,
            "status": a.status,
            "note": a.note,
        })
    
    # Сдачи
    materials = db.query(Material).filter(
        Material.group_id == group_id,
        Material.type != "lecture"
    ).all()
    
    submissions_result = []
    for m in materials:
        submission = db.query(Submission).filter(
            Submission.material_id == m.id,
            Submission.student_id == student_id
        ).order_by(Submission.submitted_at.desc()).first()
        
        if submission:
            submissions_result.append({
                "material_title": m.title,
                "material_type": m.type,
                "submitted_at": submission.submitted_at,
                "score": submission.score,
                "max_score": m.max_score,
                "status": submission.status,
            })
    
    submissions_result.sort(key=lambda x: x["submitted_at"], reverse=True)
    
    # Статистика посещаемости
    total = len(attendance_result)
    present = sum(1 for a in attendance_result if a["status"] == "present")
    absent = sum(1 for a in attendance_result if a["status"] == "absent")
    late = sum(1 for a in attendance_result if a["status"] == "late")
    
    return {
        "attendance": attendance_result,
        "submissions": submissions_result,
        "stats": {
            "total": total,
            "present": present,
            "absent": absent,
            "late": late,
            "attendance_percentage": round((present / total) * 100, 1) if total > 0 else 0,
        }
    }