from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import Course, Group, Material, Student, User, Submission
from ..dependencies import require_student, require_teacher, get_current_user

router = APIRouter(prefix="/students", tags=["students"])


class JoinRequest(BaseModel):
    course_code: str
    group_name: str


class SetStatusRequest(BaseModel):
    status: str


class DisciplineResponse(BaseModel):
    student_id: int
    group_id: int
    group_name: str
    course_id: int
    course_title: str
    course_code: str
    teacher_name: str
    status: str


@router.post("/join")
def join_discipline(
    data: JoinRequest,
    db: Session = Depends(get_db),
    student: User = Depends(require_student)
):
    """Присоединиться к дисциплине по коду курса"""
    course = db.query(Course).filter(Course.course_code == data.course_code.upper()).first()
    if not course:
        raise HTTPException(404, "Курс с таким кодом не найден")
    
    group = db.query(Group).filter(
        Group.course_id == course.id,
        Group.name == data.group_name
    ).first()
    if not group:
        raise HTTPException(404, f"Группа '{data.group_name}' не найдена в курсе")
    
    existing = db.query(Student).filter(
        Student.user_id == student.id,
        Student.group_id == group.id
    ).first()
    if existing:
        raise HTTPException(400, "Вы уже в этой группе")
    
    record = Student(
        user_id=student.id,
        group_id=group.id,
        status="not_set"
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    return {"message": "Вы присоединились к дисциплине", "group_id": group.id}


@router.get("/my-disciplines")
def get_my_disciplines(
    db: Session = Depends(get_db),
    student: User = Depends(require_student)
):
    """Все дисциплины студента со статусами"""
    records = db.query(Student).filter(Student.user_id == student.id).all()
    
    result = []
    for r in records:
        group = db.query(Group).filter(Group.id == r.group_id).first()
        if not group:
            continue
        course = db.query(Course).filter(Course.id == group.course_id).first()
        if not course:
            continue
        teacher = db.query(User).filter(User.id == course.teacher_id).first()
        
        result.append({
            "student_id": r.id,
            "group_id": group.id,
            "group_name": group.name,
            "course_id": course.id,
            "course_title": course.title,
            "course_code": course.course_code,
            "teacher_name": teacher.full_name if teacher else "—",
            "status": r.status or "not_set",
        })
    
    return result


@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    student: User = Depends(require_student)
):
    """Профиль студента"""
    return {
        "user_id": student.id,
        "email": student.email,
        "full_name": student.full_name,
    }


@router.post("/{student_id}/set-status")
def set_student_status(
    student_id: int,
    data: SetStatusRequest,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Преподаватель ставит статус студенту"""
    if data.status not in ["not_set", "automatic", "admitted", "not_admitted"]:
        raise HTTPException(400, "Неверный статус")
    
    student_record = db.query(Student).filter(Student.id == student_id).first()
    if not student_record:
        raise HTTPException(404, "Студент не найден")
    
    group = db.query(Group).filter(Group.id == student_record.group_id).first()
    course = db.query(Course).filter(Course.id == group.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    student_record.status = data.status
    db.commit()
    
    return {"message": "Статус обновлён", "status": data.status}

@router.get("/my-grades")
def get_my_grades(
    db: Session = Depends(get_db),
    student: User = Depends(require_student)
):
    """Все оценки студента по всем дисциплинам"""
    records = db.query(Student).filter(Student.user_id == student.id).all()
    
    result = []
    for record in records:
        group = db.query(Group).filter(Group.id == record.group_id).first()
        if not group:
            continue
        course = db.query(Course).filter(Course.id == group.course_id).first()
        if not course:
            continue
        teacher = db.query(User).filter(User.id == course.teacher_id).first()
        
        # Все оцениваемые материалы курса
        materials = db.query(Material).filter(
            Material.group_id == group.id,
            Material.type.in_(["lab", "hw", "test"])
        ).all()
        
        total = 0
        max_possible = 0
        grades = []
        
        for m in materials:
            max_possible += m.max_score
            submission = db.query(Submission).filter(
                Submission.material_id == m.id,
                Submission.student_id == student.id,
                Submission.status == "graded"
            ).order_by(Submission.submitted_at.desc()).first()
            
            if submission and submission.score is not None:
                total += submission.score
                grades.append({
                    "material_title": m.title,
                    "material_type": m.type,
                    "score": submission.score,
                    "max_score": m.max_score,
                    "graded_at": submission.graded_at,
                })
        
        percentage = round((total / max_possible) * 100, 1) if max_possible > 0 else 0
        
        result.append({
            "student_id": record.id,
            "course_title": course.title,
            "course_code": course.course_code,
            "group_name": group.name,
            "teacher_name": teacher.full_name if teacher else "—",
            "status": record.status or "not_set",
            "total_score": total,
            "max_possible": max_possible,
            "percentage": percentage,
            "grades": grades,
        })
    
    return result

@router.get("/course-info/{group_id}")
def get_course_info(
    group_id: int,
    db: Session = Depends(get_db),
    student: User = Depends(require_student)
):
    """Информация о курсе, к которому привязан студент (по группе)"""
    from ..models import Group, Course, Student
    
    student_record = db.query(Student).filter(
        Student.user_id == student.id,
        Student.group_id == group_id
    ).first()
    if not student_record:
        raise HTTPException(403, "Вы не в этой группе")
    
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == group.course_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден")
    
    return {
        "course_id": course.id,
        "course_title": course.title,
        "course_code": course.course_code,
        "group_name": group.name,
        "max_score": course.max_score,
        "auto_threshold": course.auto_threshold,
        "admission_threshold": course.admission_threshold,
        "planned_lectures": course.planned_lectures,
        "planned_labs": course.planned_labs,
        "planned_hw": course.planned_hw,
        "planned_tests": course.planned_tests,
        "exam_date": course.exam_date,
        "exam_room": course.exam_room,
        "exam_format": course.exam_format,
    }

@router.get("/my-progress/{group_id}")
def get_my_progress(
    group_id: int,
    db: Session = Depends(get_db),
    student: User = Depends(require_student)
):
    """Мой прогресс по дисциплине (для студента)"""
    from ..models import Group, Course, Student, Material, Submission
    
    student_record = db.query(Student).filter(
        Student.user_id == student.id,
        Student.group_id == group_id
    ).first()
    if not student_record:
        raise HTTPException(403, "Вы не в этой группе")
    
    group = db.query(Group).filter(Group.id == group_id).first()
    course = db.query(Course).filter(Course.id == group.course_id).first()
    
    # Все оцениваемые материалы
    materials = db.query(Material).filter(
        Material.group_id == group_id,
        Material.type.in_(["lab", "hw", "test"])
    ).all()
    
    max_possible = sum(m.max_score for m in materials)
    total_score = 0
    
    labs_total = 0
    labs_done = 0
    hw_total = 0
    hw_done = 0
    tests_total = 0
    tests_done = 0
    
    for m in materials:
        # Последняя оценённая сдача
        submission = db.query(Submission).filter(
            Submission.material_id == m.id,
            Submission.student_id == student.id,
            Submission.status == "graded"
        ).order_by(Submission.submitted_at.desc()).first()
        
        if submission and submission.score is not None:
            total_score += submission.score
            
            if m.type == "lab":
                labs_done += 1
            elif m.type == "hw":
                hw_done += 1
            elif m.type == "test":
                tests_done += 1
        
        if m.type == "lab":
            labs_total += 1
        elif m.type == "hw":
            hw_total += 1
        elif m.type == "test":
            tests_total += 1
    
    percentage = round((total_score / max_possible) * 100, 1) if max_possible > 0 else 0
    
    # Определяем статус
    if percentage >= course.auto_threshold:
        status = "automatic"
    elif percentage >= course.admission_threshold:
        status = "admitted"
    else:
        status = "not_admitted"
    
    return {
        "total_score": total_score,
        "max_possible": max_possible,
        "percentage": percentage,
        "status": status,
        "auto_threshold": course.auto_threshold,
        "admission_threshold": course.admission_threshold,
        "labs_total": labs_total,
        "labs_done": labs_done,
        "hw_total": hw_total,
        "hw_done": hw_done,
        "tests_total": tests_total,
        "tests_done": tests_done,
    }