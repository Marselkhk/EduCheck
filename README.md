# EduCheck

Учебная платформа для студентов, преподавателей, кураторов и родителей.

> ⚠️ Проект в активной разработке. Текущая версия — рабочий прототип с основным функционалом. Некоторые модули находятся в стадии доработки.

---

## 🎯 Что это

EduCheck — веб-приложение для организации учебного процесса:

- **Преподаватель** создаёт дисциплины, группы, лабораторные и домашние задания, тесты, выставляет оценки и посещаемость.
- **Студент** видит свои дисциплины, сдаёт работы, проходит тесты, следит за дедлайнами экзаменов и текущими баллами (автомат / допуск / отказ).
- **Куратор** отслеживает успеваемость и посещаемость студентов своей группы.
- **Родитель** видит оценки и посещаемость своего ребёнка.

---

## 🛠 Стек технологий

**Backend:**
- Python 3 + FastAPI
- SQLAlchemy + PostgreSQL
- Psycopg 3

**Frontend:**
- Next.js (App Router) + TypeScript
- React
- Tailwind CSS
- Nginx (раздача статики в проде)

**Инфраструктура:**
- Docker + Docker Compose
- PostgreSQL 16

---

## 📁 Структура проекта
EduCheck/
├── backend/ # FastAPI-приложение
│ ├── app/
│ │ ├── routes/ # API-эндпоинты (auth, courses, grades, attendance, ...)
│ │ ├── models.py # SQLAlchemy-модели
│ │ ├── schemas.py# Pydantic-схемы
│ │ └── main.py # точка входа
│ ├── Dockerfile
│ └── requirements.txt
├── frontend/ # Next.js-приложение
│ ├── app/ # страницы (App Router)
│ ├── components/ # переиспользуемые компоненты
│ ├── Dockerfile
│ └── package.json
├── docker-compose.yml
├── .env.example
└── README.md

---

## 🚀 Как запустить

### Требования
- Docker Desktop (или Docker + Docker Compose)
- Свободные порты: `3000` (фронт), `8000` (API), `5432` (БД)

### Шаги

1. **Клонировать репозиторий:**
   ```bash
   git clone https://github.com/Marselkhk/EduCheck.git
   cd EduCheck
   ```

2. **Создать `.env` из шаблона:**
   ```bash
   cp .env.example .env
   ```
   Открыть `.env` и заполнить значения:
   ```
   POSTGRES_USER=educh_admin
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=educh_db
   ```

3. **Запустить:**
   ```bash
   docker compose up -d
   ```

4. **Открыть в браузере:**
   - Frontend: http://localhost:3000
   - API-документация (Swagger): http://localhost:8000/docs

### Остановить

```bash
docker compose down
```

### Полностью сбросить БД

```bash
docker compose down -v
```

---

## 👨‍💻 Автор

**Marsel** — [@Marselkhk](https://github.com/Marselkhk)

Проект создан как учебный: архитектура, дизайн API и логика — авторские, код сгенерирован с помощью AI-ассистентов и адаптирована под задачи проекта.
   ```bash
   git clone https://github.com/Marselkhk/EduCheck.git
   cd EduCheck
