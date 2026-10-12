from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json

from ..database import get_db
from ..models import (
    Material, TestQuestion, TestResult, Submission, Student, User, Course, Group, ExtraAttempt
)
from ..dependencies import require_teacher, require_student, get_current_user

router = APIRouter(prefix="/tests", tags=["tests"])


class QuestionCreate(BaseModel):
    question_text: str
    question_type: str = "single"  # single, multiple, text
    options: list[str] = []
    correct_answer: list[str] = []  # для single — 1 элемент, для multiple — несколько
    time_limit: int = 60
    points: int = 1
    order_num: int = 0


class TestCreate(BaseModel):
    material_id: int
    questions: list[QuestionCreate]


class TestSubmit(BaseModel):
    material_id: int
    answers: dict  # {question_id: [ответы]}


@router.post("/create")
def create_test(
    data: TestCreate,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_teacher)
):
    """Создать тест (препод)"""
    material = db.query(Material).filter(Material.id == data.material_id).first()
    if not material:
        raise HTTPException(404, "Материал не найден")
    
    if material.type != "test":
        raise HTTPException(400, "Материал должен быть типа 'test'")
    
    course = db.query(Course).filter(Course.id == material.course_id).first()
    if course.teacher_id != teacher.id:
        raise HTTPException(403, "Это не ваш курс")
    
    # Удаляем старые вопросы (если редактируем)
    db.query(TestQuestion).filter(TestQuestion.material_id == data.material_id).delete()
    
    # Создаём вопросы
    for i, q in enumerate(data.questions):
        question = TestQuestion(
            material_id=data.material_id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=json.dumps(q.options, ensure_ascii=False),
            correct_answer=json.dumps(q.correct_answer, ensure_ascii=False),
            time_limit=q.time_limit,
            points=q.points,
            order_num=i
        )
        db.add(question)
    
    db.commit()
    return {"message": "Тест сохранён", "questions_count": len(data.questions)}


@router.get("/{material_id}/questions")
def get_questions(
    material_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Получить вопросы теста (для студента — без правильных ответов)"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Материал не найден")
    
    questions = db.query(TestQuestion).filter(
        TestQuestion.material_id == material_id
    ).order_by(TestQuestion.order_num).all()
    
    result = []
    for q in questions:
        item = {
            "id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "options": json.loads(q.options) if q.options else [],
            "time_limit": q.time_limit,
            "points": q.points,
        }
        # Правильные ответы только для препода
        if user.role == "teacher":
            item["correct_answer"] = json.loads(q.correct_answer) if q.correct_answer else []
        result.append(item)
    
    return result


@router.post("/submit")
def submit_test(
    data: TestSubmit,
    db: Session = Depends(get_db),
    student: User = Depends(require_student)
):
    """Студент отправляет ответы на тест"""
    material = db.query(Material).filter(Material.id == data.material_id).first()
    if not material:
        raise HTTPException(404, "Материал не найден")
    
    student_record = db.query(Student).filter(
        Student.user_id == student.id,
        Student.group_id == material.group_id
    ).first()
    if not student_record:
        raise HTTPException(403, "Это не ваш материал")
    
    # Проверяем попытки
    used = db.query(Submission).filter(
        Submission.material_id == data.material_id,
        Submission.student_id == student.id
    ).count()
    
    extra_record = db.query(ExtraAttempt).filter(
        ExtraAttempt.student_id == student.id,
        ExtraAttempt.material_id == data.material_id
    ).first()
    extra = extra_record.extra if extra_record else 0
    total_attempts = material.max_attempts + extra
    
    if used >= total_attempts:
        raise HTTPException(403, "Попытки закончились")
    
    # Получаем вопросы
    questions = db.query(TestQuestion).filter(
        TestQuestion.material_id == data.material_id
    ).all()
    
    if not questions:
        raise HTTPException(404, "В тесте нет вопросов")
    
    # Считаем баллы
    auto_score = 0
    max_score = 0
    
    for q in questions:
        max_score += q.points
        
        student_answer = data.answers.get(str(q.id), [])
        correct = json.loads(q.correct_answer) if q.correct_answer else []
        
        # Проверка: single — один ответ, multiple — все должны совпасть
        if q.question_type == "single":
            if student_answer and correct and student_answer[0] == correct[0]:
                auto_score += q.points
        elif q.question_type == "multiple":
            if set(student_answer) == set(correct):
                auto_score += q.points
        elif q.question_type == "text":
            if student_answer and correct and student_answer[0].strip().lower() == correct[0].strip().lower():
                auto_score += q.points
    
    # Создаём сдачу
    submission = Submission(
        material_id=data.material_id,
        student_id=student.id,
        text_answer=json.dumps(data.answers),
        status="pending"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    # Создаём результат
    result = TestResult(
        student_id=student.id,
        material_id=data.material_id,
        submission_id=submission.id,
        answers=json.dumps(data.answers),
        auto_score=auto_score,
        max_score=max_score,
        confirmed=False
    )
    db.add(result)
    db.commit()
    
    # Уменьшаем доп. попытку, если использовали
    if extra_record and extra_record.extra > 0 and used >= material.max_attempts:
        extra_record.extra -= 1
        db.commit()
    
    return {
        "message": "Тест отправлен",
        "auto_score": auto_score,
        "max_score": max_score,
        "submission_id": submission.id,
    }


@router.get("/{material_id}/result/{submission_id}")
def get_test_result(
    material_id: int,
    submission_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Результат теста"""
    result = db.query(TestResult).filter(
        TestResult.material_id == material_id,
        TestResult.submission_id == submission_id
    ).first()
    
    if not result:
        raise HTTPException(404, "Результат не найден")
    
    # Студент может смотреть только свой результат
    if user.role == "student" and result.student_id != user.id:
        raise HTTPException(403, "Это не ваш результат")
    
    return {
        "auto_score": result.auto_score,
        "max_score": result.max_score,
        "confirmed": result.confirmed,
        "answers": json.loads(result.answers) if result.answers else {},
    }