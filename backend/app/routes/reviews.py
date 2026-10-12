from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import Review, Course, Student, User
from ..dependencies import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewCreate(BaseModel):
    course_id: int
    rating: int
    comment: str | None = None


@router.post("/")
def create_or_update_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Студент оставляет или обновляет отзыв"""
    if user.role != "student":
        raise HTTPException(403, "Только студенты могут оставлять отзывы")
    
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(400, "Оценка от 1 до 5")
    
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден")
    
    # Проверяем, что студент в группе курса
    student = db.query(Student).join(
        Student.group
    ).filter(
        Student.user_id == user.id,
        Student.group_id.in_(
            db.query(Student.group_id).join(
                Course, Course.id == data.course_id
            )
        )
    ).first()
    
    # Упрощённая проверка: студент вообще в этом курсе?
    from ..models import Group
    groups = db.query(Group).filter(Group.course_id == data.course_id).all()
    group_ids = [g.id for g in groups]
    is_in_course = db.query(Student).filter(
        Student.user_id == user.id,
        Student.group_id.in_(group_ids)
    ).first()
    
    if not is_in_course:
        raise HTTPException(403, "Вы не учитесь на этом курсе")
    
    existing = db.query(Review).filter(
        Review.student_id == user.id,
        Review.course_id == data.course_id
    ).first()
    
    if existing:
        existing.rating = data.rating
        existing.comment = data.comment
        db.commit()
        db.refresh(existing)
        return {"message": "Отзыв обновлён", "id": existing.id}
    
    review = Review(
        student_id=user.id,
        teacher_id=course.teacher_id,
        course_id=data.course_id,
        rating=data.rating,
        comment=data.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    
    return {"message": "Отзыв создан", "id": review.id}


@router.get("/my/{course_id}")
def get_my_review(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Мой отзыв на курс"""
    review = db.query(Review).filter(
        Review.student_id == user.id,
        Review.course_id == course_id
    ).first()
    
    if not review:
        return None
    
    return {
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
    }


@router.get("/teacher/{teacher_id}")
def get_teacher_reviews(
    teacher_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Отзывы о преподавателе (только сам препод)"""
    if user.id != teacher_id and user.role != "teacher":
        raise HTTPException(403, "Только сам преподаватель видит свои отзывы")
    
    if user.role == "teacher" and user.id != teacher_id:
        raise HTTPException(403, "Вы можете видеть только свои отзывы")
    
    reviews = db.query(Review).filter(Review.teacher_id == teacher_id).all()
    
    if not reviews:
        return {
            "average": 0,
            "count": 0,
            "reviews": []
        }
    
    average = round(sum(r.rating for r in reviews) / len(reviews), 1)
    
    result = []
    for r in reviews:
        course = db.query(Course).filter(Course.id == r.course_id).first()
        result.append({
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "course_title": course.title if course else "",
            "created_at": r.created_at,
        })
    
    return {
        "average": average,
        "count": len(reviews),
        "reviews": result
    }


@router.get("/course/{course_id}/stats")
def get_course_stats(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Статистика отзывов о курсе (для студента — чтобы видеть)"""
    reviews = db.query(Review).filter(Review.course_id == course_id).all()
    
    if not reviews:
        return {"average": 0, "count": 0}
    
    average = round(sum(r.rating for r in reviews) / len(reviews), 1)
    
    return {
        "average": average,
        "count": len(reviews)
    }