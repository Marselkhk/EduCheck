from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json

from ..database import get_db
from ..models import PublicProfile, User, Student, Course, Group, Material, Submission
from ..dependencies import get_current_user, require_student

router = APIRouter(prefix="/profiles", tags=["profiles"])


class ProfileUpdate(BaseModel):
    bio: str | None = None
    skills: list[str] = []
    contacts: dict = {}
    is_public: bool = False
    show_courses: bool = True


@router.get("/my")
def get_my_profile(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Мой публичный профиль"""
    profile = db.query(PublicProfile).filter(
        PublicProfile.user_id == user.id
    ).first()
    
    if not profile:
        return {
            "bio": "",
            "skills": [],
            "contacts": {},
            "is_public": False,
            "show_courses": True,
        }
    
    return {
        "bio": profile.bio or "",
        "skills": json.loads(profile.skills) if profile.skills else [],
        "contacts": json.loads(profile.contacts) if profile.contacts else {},
        "is_public": profile.is_public,
        "show_courses": profile.show_courses,
    }


@router.post("/my")
def update_my_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Обновить мой публичный профиль"""
    profile = db.query(PublicProfile).filter(
        PublicProfile.user_id == user.id
    ).first()
    
    if not profile:
        profile = PublicProfile(user_id=user.id)
        db.add(profile)
    
    profile.bio = data.bio
    profile.skills = json.dumps(data.skills, ensure_ascii=False)
    profile.contacts = json.dumps(data.contacts, ensure_ascii=False)
    profile.is_public = data.is_public
    profile.show_courses = data.show_courses
    
    db.commit()
    return {"message": "Профиль сохранён"}


@router.get("/public/{user_id}")
def get_public_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Публичный профиль студента (без авторизации)"""
    user = db.query(User).filter(User.id == user_id, User.role == "student").first()
    if not user:
        raise HTTPException(404, "Студент не найден")
    
    profile = db.query(PublicProfile).filter(
        PublicProfile.user_id == user_id,
        PublicProfile.is_public == True
    ).first()
    
    if not profile:
        raise HTTPException(404, "Профиль не публичный")
    
    result = {
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "bio": profile.bio or "",
        "skills": json.loads(profile.skills) if profile.skills else [],
        "contacts": json.loads(profile.contacts) if profile.contacts else {},
        "courses": [],
    }
    
    # Если студент разрешил показывать курсы
    if profile.show_courses:
        student_records = db.query(Student).filter(Student.user_id == user_id).all()
        
        for record in student_records:
            group = db.query(Group).filter(Group.id == record.group_id).first()
            if not group:
                continue
            course = db.query(Course).filter(Course.id == group.course_id).first()
            if not course:
                continue
            
            # Оценки студента
            materials = db.query(Material).filter(
                Material.group_id == group.id,
                Material.type.in_(["lab", "hw", "test"])
            ).all()
            
            total = 0
            max_possible = 0
            projects = []
            
            for m in materials:
                max_possible += m.max_score
                submission = db.query(Submission).filter(
                    Submission.material_id == m.id,
                    Submission.student_id == user_id,
                    Submission.status == "graded"
                ).order_by(Submission.submitted_at.desc()).first()
                
                if submission and submission.score is not None:
                    total += submission.score
                    projects.append({
                        "title": m.title,
                        "type": m.type,
                        "score": submission.score,
                        "max_score": m.max_score,
                    })
            
            percentage = round((total / max_possible) * 100, 1) if max_possible > 0 else 0
            
            result["courses"].append({
                "course_title": course.title,
                "course_code": course.course_code,
                "group_name": group.name,
                "total_score": total,
                "max_possible": max_possible,
                "percentage": percentage,
                "projects": projects,
            })
    
    return result