from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# Загружаем переменные из .env
load_dotenv()

# Берём URL базы данных из .env
DATABASE_URL = os.getenv("DATABASE_URL")
# SQLAlchemy по умолчанию ищет psycopg2, а у нас psycopg (v3)
# Меняем драйвер в URL
DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")

# Создаём движок (подключение к БД)
engine = create_engine(DATABASE_URL)

# Создаём фабрику сессий (через неё делаем запросы)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей (таблиц)
Base = declarative_base()

# Функция для получения сессии (используется в API)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()