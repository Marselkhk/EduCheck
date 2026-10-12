from pydantic import BaseModel, EmailStr
from datetime import datetime


# ====== РЕГИСТРАЦИЯ ======

class TeacherRegister(BaseModel):
    """Данные для регистрации преподавателя"""
    email: EmailStr
    password: str
    full_name: str
    university: str
    department: str | None = None


class StudentRegister(BaseModel):
    """Данные для регистрации студента"""
    email: EmailStr
    password: str
    full_name: str
    faculty: str


# ====== ЛОГИН ======

class UserLogin(BaseModel):
    """Данные для входа"""
    email: EmailStr
    password: str


# ====== ОТВЕТЫ ======

class TokenResponse(BaseModel):
    """Что сервер возвращает после успешного входа"""
    token: str
    role: str
    full_name: str


# ====== КУРСЫ ======

class CourseCreate(BaseModel):
    """Данные для создания курса"""
    title: str
    description: str | None = None
    max_score: int = 100
    auto_threshold: int = 80
    admission_threshold: int = 50
    planned_lectures: int = 0
    planned_labs: int = 0
    planned_hw: int = 0
    planned_tests: int = 0


class CourseResponse(BaseModel):
    """Ответ с информацией о курсе"""
    id: int
    title: str
    description: str | None
    course_code: str
    max_score: int
    auto_threshold: int
    admission_threshold: int
    planned_lectures: int
    planned_labs: int
    planned_hw: int
    planned_tests: int
    exam_date: datetime | None
    exam_room: str | None
    exam_format: str | None
    
    class Config:
        from_attributes = True
    
    class Config:
        from_attributes = True


# ====== ГРУППЫ ======

class GroupCreate(BaseModel):
    """Данные для создания группы"""
    name: str


class GroupResponse(BaseModel):
    """Ответ с информацией о группе"""
    id: int
    name: str
    course_id: int
    
    class Config:
        from_attributes = True


class StudentInGroup(BaseModel):
    """Студент в группе"""
    user_id: int
    email: str
    full_name: str
    
    class Config:
        from_attributes = True


# ====== МАТЕРИАЛЫ ======

class MaterialResponse(BaseModel):
    """Информация о материале"""
    id: int
    course_id: int
    group_id: int
    title: str
    type: str
    description: str | None
    file_path: str | None
    max_score: int
    max_attempts: int
    opens_at: datetime
    deadline: datetime | None
    created_at: datetime
    
    class Config:
        from_attributes = True


class SubmissionResponse(BaseModel):
    """Информация о сданной работе"""
    id: int
    material_id: int
    student_id: int
    file_path: str | None
    text_answer: str | None
    comment: str | None
    score: int | None
    teacher_comment: str | None
    status: str
    submitted_at: datetime
    graded_at: datetime | None
    
    class Config:
        from_attributes = True


class SubmissionGrade(BaseModel):
    """Данные для выставления оценки"""
    score: int
    teacher_comment: str | None = None


# ====== УСПЕВАЕМОСТЬ ======

class StudentGrade(BaseModel):
    """Оценки студента по группе"""
    student_id: int
    full_name: str
    total_score: int
    max_possible: int
    percentage: float
    status: str


class GroupGradesResponse(BaseModel):
    """Успеваемость всей группы"""
    group_id: int
    group_name: str
    course_title: str
    max_score: int
    auto_threshold: int
    admission_threshold: int
    students: list[StudentGrade]


class StudentProfile(BaseModel):
    """Профиль студента с информацией о группе и курсе"""
    user_id: int
    email: str
    full_name: str
    group_id: int
    group_name: str
    course_id: int
    course_title: str
    course_code: str

class ParentRegister(BaseModel):
    """Данные для регистрации родителя"""
    email: EmailStr
    password: str
    full_name: str

class CuratorRegister(BaseModel):
    """Данные для регистрации куратора"""
    email: EmailStr
    password: str
    full_name: str