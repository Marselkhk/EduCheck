from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os
import shutil
import uuid

from ..database import get_db
from ..models import (
    Course, Group, Material, Student, User, Submission,
    Complaint, Note, ExtraAttempt, TestQuestion, TestResult
)
from ..schemas import MaterialResponse
from ..dependencies import require_teacher, get_current_user

router = APIRouter(prefix="/materials", tags=["materials"])

UPLOAD_DIR = "uploads/materials"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", response_model=MaterialResponse)
def create_material(
    title: str = Form(...),
    type: str = Form(...),
    group_id: int = Form(...),
    opens_at: str = Form(...),
    deadline: str = Form(None),
    closes_at: str = Form(None),
    max_score: int = Form(10),
    max_attempts: int = Form(1),
    description: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Загрузить материал (только препод)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == group.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    filepath = None
    if file:
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    
    opens_at_dt = datetime.fromisoformat(opens_at)
    deadline_dt = datetime.fromisoformat(deadline) if deadline else None
    closes_at_dt = datetime.fromisoformat(closes_at) if closes_at else None
    
    material = Material(
        course_id=course.id,
        group_id=group_id,
        title=title,
        type=type,
        description=description,
        file_path=filepath,
        max_score=max_score,
        max_attempts=max_attempts,
        opens_at=opens_at_dt,
        deadline=deadline_dt,
        closes_at=closes_at_dt
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.get("/my-materials")
def get_my_materials(
    group_id: int,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_user)
):
    """Материалы для конкретной группы студента"""
    student_record = db.query(Student).filter(
        Student.user_id == student.id,
        Student.group_id == group_id
    ).first()
    if not student_record:
        raise HTTPException(403, "Вы не в этой группе")
    
    materials = db.query(Material).filter(Material.group_id == group_id).all()
    
    result = []
    for m in materials:
        # Последняя сдача
        submission = db.query(Submission).filter(
            Submission.material_id == m.id,
            Submission.student_id == student.id
        ).order_by(Submission.submitted_at.desc()).first()
        
        # Количество попыток
        used = db.query(Submission).filter(
            Submission.material_id == m.id,
            Submission.student_id == student.id
        ).count()
        
        # Проверяем финальную
        final_submission = db.query(Submission).filter(
            Submission.material_id == m.id,
            Submission.student_id == student.id,
            Submission.is_final == True
        ).first()
        
        is_final = final_submission is not None
        
        # Учитываем доп. попытки
        extra_record = db.query(ExtraAttempt).filter(
            ExtraAttempt.student_id == student.id,
            ExtraAttempt.material_id == m.id
        ).first()
        extra = extra_record.extra if extra_record else 0
        total_attempts = m.max_attempts + extra
        left = max(0, total_attempts - used)
        
        # Если есть доп. попытка — снимаем is_final
        if extra > 0:
            is_final = False
        
        result.append({
            "id": m.id,
            "title": m.title,
            "type": m.type,
            "description": m.description,
            "max_score": m.max_score,
            "max_attempts": m.max_attempts,
            "attempts_left": left,
            "is_final": is_final,
            "opens_at": m.opens_at,
            "deadline": m.deadline,
            "closes_at": m.closes_at,
            "submitted": submission is not None,
            "submission_id": submission.id if submission else None,
            "score": submission.score if submission else None,
            "status": submission.status if submission else "not_submitted",
            "teacher_comment": submission.teacher_comment if submission else None
        })
    
    return result


@router.get("/group/{group_id}", response_model=list[MaterialResponse])
def get_group_materials(
    group_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Открытые материалы для группы (студент)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    now = datetime.utcnow()
    materials = db.query(Material).filter(
        Material.group_id == group_id,
        Material.opens_at <= now
    ).all()
    
    return materials


@router.get("/all/{group_id}", response_model=list[MaterialResponse])
def get_all_group_materials(
    group_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """ВСЕ материалы группы (препод, включая закрытые)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(404, "Группа не найдена")
    
    course = db.query(Course).filter(Course.id == group.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    materials = db.query(Material).filter(Material.group_id == group_id).all()
    return materials


@router.get("/{material_id}/download")
def download_material(
    material_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Скачать файл материала"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Материал не найден")
    
    if not material.file_path or not os.path.exists(material.file_path):
        raise HTTPException(404, "Файл не найден")
    
    if user.role == "student":
        if material.opens_at > datetime.utcnow():
            raise HTTPException(403, "Материал ещё не открыт")
    
    original_filename = os.path.basename(material.file_path)
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
        path=material.file_path,
        filename=original_filename,
        media_type=media_type
    )


@router.get("/{material_id}/file-info")
def get_material_file_info(
    material_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Информация о файле материала (имя)"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Материал не найден")
    
    filename = os.path.basename(material.file_path) if material.file_path else "file"
    if "_" in filename:
        filename = filename.split("_", 1)[1]
    
    return {"filename": filename}


@router.get("/{material_id}/attempts")
def get_attempts_left(
    material_id: int,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_user)
):
    """Сколько попыток осталось у студента"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Материал не найден")
    
    # Находим студента в группе
    student_record = db.query(Student).filter(
        Student.user_id == student.id,
        Student.group_id == material.group_id
    ).first()
    
    if not student_record:
        raise HTTPException(403, "Вы не в этой группе")
    
    # Считаем попытки
    used = db.query(Submission).filter(
        Submission.material_id == material_id,
        Submission.student_id == student.id
    ).count()
    
    # Проверяем финальную
    final_submission = db.query(Submission).filter(
        Submission.material_id == material_id,
        Submission.student_id == student.id,
        Submission.is_final == True
    ).first()
    
    is_final = final_submission is not None
    
    extra_record = db.query(ExtraAttempt).filter(
        ExtraAttempt.student_id == student.id,
        ExtraAttempt.material_id == material_id
    ).first()
    extra = extra_record.extra if extra_record else 0
    total_attempts = material.max_attempts + extra
    left = max(0, total_attempts - used)
    
    # Если есть доп. попытка — снимаем is_final
    if extra > 0:
        is_final = False
    
    return {
        "max_attempts": material.max_attempts,
        "extra_attempts": extra,
        "total_attempts": total_attempts,
        "used": used,
        "left": left,
        "is_final": is_final,
        "can_submit": left > 0
    }


@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(
    material_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Информация о материале по ID"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Материал не найден")
    return material


@router.delete("/{material_id}")
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Удалить материал (только препод-владелец)"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Материал не найден")
    
    course = db.query(Course).filter(Course.id == material.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    # 1. Получаем все сдачи этого материала
    submissions = db.query(Submission).filter(
        Submission.material_id == material_id
    ).all()
    
    submission_ids = [s.id for s in submissions]
    
    # 2. Удаляем результаты тестов (ссылаются на submissions)
    db.query(TestResult).filter(TestResult.material_id == material_id).delete()
    
    # 3. Удаляем жалобы (ссылаются на submissions)
    if submission_ids:
        db.query(Complaint).filter(
            Complaint.submission_id.in_(submission_ids)
        ).delete(synchronize_session=False)
    
    # 4. Удаляем сдачи
    db.query(Submission).filter(Submission.material_id == material_id).delete()
    
    # 5. Удаляем вопросы теста
    db.query(TestQuestion).filter(TestQuestion.material_id == material_id).delete()
    
    # 6. Удаляем заметки
    db.query(Note).filter(Note.material_id == material_id).delete()
    
    # 7. Удаляем доп. попытки
    db.query(ExtraAttempt).filter(ExtraAttempt.material_id == material_id).delete()
    
    # 8. Удаляем файл
    if material.file_path and os.path.exists(material.file_path):
        os.remove(material.file_path)
    
    # 9. Удаляем материал
    db.delete(material)
    db.commit()
    
    return {"message": "Материал удалён"}