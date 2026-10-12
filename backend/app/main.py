# Импортируем FastAPI — библиотеку для создания веб-сервера
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth
# Создаём приложение (наш сервер)
app = FastAPI(title="EduCheck API")

# Настройка CORS — разрешаем фронтенду обращаться к бэкенду
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
from .routes import courses
app.include_router(courses.router)

from .routes import groups
app.include_router(groups.router)

from .routes import materials
app.include_router(materials.router)

from .routes import submissions
app.include_router(submissions.router)

from .routes import grades
app.include_router(grades.router)

from .routes import students
app.include_router(students.router)

from .routes import notifications
app.include_router(notifications.router)

from .routes import messages
app.include_router(messages.router)

from .routes import notes
app.include_router(notes.router)

from .routes import reviews
app.include_router(reviews.router)

from .routes import complaints
app.include_router(complaints.router)

from .routes import tests
app.include_router(tests.router)

from .routes import profiles
app.include_router(profiles.router)

from .routes import attendance
app.include_router(attendance.router)

from .routes import parents
app.include_router(parents.router)

from .routes import curators
app.include_router(curators.router)

# Главная страница API
@app.get("/")
def root():
    return {"message": "EduCheck API is running!"}

# Проверка работоспособности
@app.get("/health")
def health():
    return {"status": "ok"}
# Импортируем движок базы данных
from .database import engine, Base
from . import models

@app.on_event("startup")
def startup():
    # Создаём все таблицы, которых ещё нет в базе
    Base.metadata.create_all(bind=engine)
    print("✅ Таблицы созданы (или уже существовали)")