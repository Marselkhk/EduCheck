from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os
import shutil
import uuid

from ..database import get_db
from ..models import (
    Material, Submission, Student, User, Group, Course,
    Notification, ExtraAttempt, TestResult
)
from ..schemas import SubmissionResponse, SubmissionGrade
from ..dependencies import require_teacher, require_student, get_current_user

router = APIRouter(prefix="/submissions", tags=["submissions"])

UPLOAD_DIR = "uploads/submissions"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", response_model=SubmissionResponse)
def submit_work(
    material_id: int = Form(...),
    comment: str = Form(None),
    text_answer: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    student: User = Depends(require_student)
):
    """Сдать работу (только студент)"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Материал не найден")
    
    student_record = db.query(Student).filter(
        Student.user_id == student.id,
        Student.group_id == material.group_id
    ).first()
    if not student_record:
        raise HTTPException(403, "Это не ваш материал")
    
    now = datetime.utcnow()
    
    if material.opens_at > now:
        raise HTTPException(403, "Материал ещё не открыт")
    
    if material.closes_at and now > material.closes_at:
        raise HTTPException(403, "Материал закрыт")
    
    if material.deadline and now > material.deadline:
        raise HTTPException(403, "Дедлайн прошёл")
    
    used = db.query(Submission).filter(
        Submission.material_id == material_id,
        Submission.student_id == student.id
    ).count()
    
    extra_record = db.query(ExtraAttempt).filter(
        ExtraAttempt.student_id == student.id,
        ExtraAttempt.material_id == material_id
    ).first()
    extra = extra_record.extra if extra_record else 0
    total_attempts = material.max_attempts + extra
    
    if used >= total_attempts:
        raise HTTPException(403, "Попытки закончились")
    
    if not file and not text_answer:
        raise HTTPException(400, "Прикрепите файл или напишите ответ")
    
    filepath = None
    if file:
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    
    submission = Submission(
        material_id=material_id,
        student_id=student.id,
        file_path=filepath,
        text_answer=text_answer,
        comment=comment,
        status="pending"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    if extra_record and extra_record.extra > 0 and used >= material.max_attempts:
        extra_record.extra -= 1
        db.commit()
    
    return submission


@router.get("/material/{material_id}")
def get_submissions(
    material_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Получить все сдачи по материалу (только препод-владелец)"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Материал не найден")
    
    course = db.query(Course).filter(Course.id == material.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    submissions = db.query(Submission).filter(
        Submission.material_id == material_id
    ).order_by(Submission.student_id, Submission.submitted_at).all()
    
    result = []
    student_attempt_counter = {}
    
    extra_attempts = db.query(ExtraAttempt).filter(
        ExtraAttempt.material_id == material_id
    ).all()
    
    extra_map = {e.student_id: e.extra for e in extra_attempts}
    
    for s in submissions:
        if s.student_id not in student_attempt_counter:
            student_attempt_counter[s.student_id] = 0
        student_attempt_counter[s.student_id] += 1
        
        student_user = db.query(User).filter(User.id == s.student_id).first()
        
        extra = extra_map.get(s.student_id, 0)
        base_attempts = material.max_attempts
        
        attempt_num = student_attempt_counter[s.student_id]
        is_extra = attempt_num > base_attempts
        
        # Если это тест — добавляем авто-балл
        test_result = None
        if material.type == "test":
            test_result = db.query(TestResult).filter(
                TestResult.submission_id == s.id
            ).first()
        
        result.append({
            "id": s.id,
            "material_id": s.material_id,
            "student_id": s.student_id,
            "student_name": student_user.full_name if student_user else f"Студент #{s.student_id}",
            "student_email": student_user.email if student_user else "",
            "attempt_number": attempt_num,
            "is_extra_attempt": is_extra,
            "is_final": s.is_final,
            "file_path": s.file_path,
            "text_answer": s.text_answer,
            "comment": s.comment,
            "score": s.score,
            "teacher_comment": s.teacher_comment,
            "status": s.status,
            "submitted_at": s.submitted_at,
            "graded_at": s.graded_at,
            "is_test": material.type == "test",
            "test_auto_score": test_result.auto_score if test_result else None,
            "test_max_score": test_result.max_score if test_result else None,
            "test_confirmed": test_result.confirmed if test_result else False,
        })
    
    return result


@router.post("/{submission_id}/grade", response_model=SubmissionResponse)
def grade_submission(
    submission_id: int,
    data: SubmissionGrade,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Выставить балл за работу (только препод)"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(404, "Работа не найдена")
    
    material = db.query(Material).filter(Material.id == submission.material_id).first()
    course = db.query(Course).filter(Course.id == material.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    if data.score < 0 or data.score > material.max_score:
        raise HTTPException(400, f"Балл должен быть от 0 до {material.max_score}")
    
    submission.score = data.score
    submission.teacher_comment = data.teacher_comment
    submission.status = "graded"
    submission.graded_at = datetime.utcnow()
    db.commit()
    db.refresh(submission)
    
    # Если это тест — подтверждаем результат
    if material.type == "test":
        test_result = db.query(TestResult).filter(
            TestResult.submission_id == submission.id
        ).first()
        
        if test_result:
            test_result.confirmed = True
            db.commit()
    
    # Уведомление студенту
    notification = Notification(
        user_id=submission.student_id,
        title="Работа оценена",
        message=f'Ваша работа "{material.title}" оценена: {data.score}/{material.max_score}',
        type="grade",
        link=f"/student/discipline/{material.group_id}"
    )
    db.add(notification)
    db.commit()
    
    return submission


@router.post("/{submission_id}/finalize")
def finalize_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Преподаватель подтверждает финальную попытку — попытки закрываются"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(404, "Работа не найдена")
    
    material = db.query(Material).filter(Material.id == submission.material_id).first()
    course = db.query(Course).filter(Course.id == material.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    db.query(Submission).filter(
        Submission.material_id == submission.material_id,
        Submission.student_id == submission.student_id
    ).update({"is_final": False})
    
    submission.is_final = True
    db.commit()
    db.refresh(submission)
    
    extra_record = db.query(ExtraAttempt).filter(
        ExtraAttempt.student_id == submission.student_id,
        ExtraAttempt.material_id == submission.material_id
    ).first()
    
    if extra_record:
        extra_record.extra = 0
        db.commit()
    
    return {"message": "Работа подтверждена. Попытки закрыты.", "is_final": True}


@router.get("/my", response_model=list[SubmissionResponse])
def get_my_submissions(
    db: Session = Depends(get_db),
    student: User = Depends(require_student)
):
    """Мои сдачи (для студента)"""
    submissions = db.query(Submission).filter(
        Submission.student_id == student.id
    ).order_by(Submission.submitted_at.desc()).all()
    return submissions


@router.get("/{submission_id}/file-info")
def get_submission_file_info(
    submission_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Информация о файле сдачи (имя)"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(404, "Работа не найдена")
    
    if not submission.file_path:
        return {"filename": "file"}
    
    filename = os.path.basename(submission.file_path)
    if "_" in filename:
        filename = filename.split("_", 1)[1]
    
    return {"filename": filename}


@router.get("/{submission_id}/download")
def download_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Скачать сданную работу (только препод-владелец курса)"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(404, "Работа не найдена")
    
    if not submission.file_path or not os.path.exists(submission.file_path):
        raise HTTPException(404, "Файл не найден")
    
    material = db.query(Material).filter(Material.id == submission.material_id).first()
    course = db.query(Course).filter(Course.id == material.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    original_filename = os.path.basename(submission.file_path)
    if "_" in original_filename:
        original_filename = original_filename.split("_", 1)[1]
    
    ext = original_filename.split(".")[-1].lower() if "." in original_filename else ""
    mime_types = {
        "pdf": "application/pdf",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls": "application/vnd.ms-excel",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "ppt": "application/vnd.ms-powerpoint",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "txt": "text/plain",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "gif": "image/gif",
        "zip": "application/zip",
        "rar": "application/x-rar-compressed",
        "py": "text/x-python",
        "js": "text/javascript",
        "java": "text/x-java-source",
        "cpp": "text/x-c++src",
        "c": "text/x-csrc",
        "html": "text/html",
        "css": "text/css",
        "json": "application/json",
        "md": "text/markdown",
        "sql": "application/sql",
    }
    media_type = mime_types.get(ext, "application/octet-stream")
    
    return FileResponse(
        path=submission.file_path,
        filename=original_filename,
        media_type=media_type
    )