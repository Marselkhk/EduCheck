from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

from ..database import get_db
from ..models import User, Course, Group, Student
from ..schemas import TeacherRegister, StudentRegister, UserLogin, TokenResponse

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

# ====== НАСТРОЙКИ ======
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-me")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

# Для шифрования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ====== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======

def hash_password(password: str) -> str:
    """Шифрует пароль"""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Проверяет пароль"""
    return pwd_context.verify(plain, hashed)


def create_token(user_id: int, role: str) -> str:
    """Создаёт JWT-токен"""
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ====== РЕГИСТРАЦИЯ ПРЕПОДАВАТЕЛЯ ======

@router.post("/register/teacher", response_model=TokenResponse)
def register_teacher(data: TeacherRegister, db: Session = Depends(get_db)):
    # Проверяем, нет ли уже такого email
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(400, "Email уже зарегистрирован")
    
    # Создаём пользователя
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role="teacher"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Создаём токен
    token = create_token(user.id, user.role)
    return {"token": token, "role": user.role, "full_name": user.full_name}


# ====== РЕГИСТРАЦИЯ СТУДЕНТА ======

@router.post("/register/student", response_model=TokenResponse)
def register_student(data: StudentRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(400, "Email уже зарегистрирован")
    
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role="student"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_token(user.id, user.role)
    return {"token": token, "role": user.role, "full_name": user.full_name}

# ====== ЛОГИН ======

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Неверный email или пароль")
    
    token = create_token(user.id, user.role)
    return {"token": token, "role": user.role, "full_name": user.full_name}
from ..dependencies import get_current_user
from ..models import User

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Возвращает информацию о текущем пользователе"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role
    }

from ..schemas import ParentRegister


@router.post("/register/parent", response_model=TokenResponse)
def register_parent(data: ParentRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(400, "Email уже зарегистрирован")
    
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role="parent"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_token(user.id, user.role)
    return {"token": token, "role": user.role, "full_name": user.full_name}

from ..schemas import CuratorRegister


@router.post("/register/curator", response_model=TokenResponse)
def register_curator(data: CuratorRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(400, "Email уже зарегистрирован")
    
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role="curator"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_token(user.id, user.role)
    return {"token": token, "role": user.role, "full_name": user.full_name}