from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    course_code = Column(String, unique=True, nullable=False)
    max_score = Column(Integer, default=100)
    auto_threshold = Column(Integer, default=80)
    admission_threshold = Column(Integer, default=50)
    
    planned_lectures = Column(Integer, default=0)
    planned_labs = Column(Integer, default=0)
    planned_hw = Column(Integer, default=0)
    planned_tests = Column(Integer, default=0)
    
    exam_date = Column(DateTime)
    exam_room = Column(String)
    exam_format = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    teacher = relationship("User")
    groups = relationship("Group", back_populates="course", cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="course", cascade="all, delete-orphan")


class Group(Base):
    __tablename__ = "groups"
    
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    name = Column(String, nullable=False)
    
    course = relationship("Course", back_populates="groups")
    students = relationship("Student", back_populates="group", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="group", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="group", cascade="all, delete-orphan")
    curators = relationship("CuratorLink", back_populates="group", cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="group", cascade="all, delete-orphan")


class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    status = Column(String, default="not_set")
    extra_attempts = Column(Integer, default=0)
    
    user = relationship("User")
    group = relationship("Group", back_populates="students")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text)
    type = Column(String, default="info")
    link = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    text = Column(Text, nullable=False)
    is_forum = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
    group = relationship("Group", back_populates="messages")


class Material(Base):
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)
    description = Column(Text)
    file_path = Column(String)
    max_score = Column(Integer, default=10)
    max_attempts = Column(Integer, default=1)
    opens_at = Column(DateTime, nullable=False)
    deadline = Column(DateTime)
    closes_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    course = relationship("Course", back_populates="materials")
    group = relationship("Group", back_populates="materials")
    submissions = relationship("Submission", back_populates="material", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="material", cascade="all, delete-orphan")
    extra_attempts = relationship("ExtraAttempt", back_populates="material", cascade="all, delete-orphan")
    test_questions = relationship("TestQuestion", back_populates="material", cascade="all, delete-orphan")
    test_results = relationship("TestResult", back_populates="material", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_path = Column(String)
    text_answer = Column(Text)
    comment = Column(Text)
    score = Column(Integer)
    teacher_comment = Column(Text)
    status = Column(String, default="pending")
    is_final = Column(Boolean, default=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    graded_at = Column(DateTime)
    
    material = relationship("Material", back_populates="submissions")
    student = relationship("User")
    complaints = relationship("Complaint", back_populates="submission", cascade="all, delete-orphan")
    test_results = relationship("TestResult", back_populates="submission", cascade="all, delete-orphan")


class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User")
    material = relationship("Material", back_populates="notes")


class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    student = relationship("User", foreign_keys=[student_id])
    teacher = relationship("User", foreign_keys=[teacher_id])
    course = relationship("Course")


class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    status = Column(String, default="open")
    teacher_response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    
    student = relationship("User", foreign_keys=[student_id])
    teacher = relationship("User", foreign_keys=[teacher_id])
    submission = relationship("Submission", back_populates="complaints")


class ExtraAttempt(Base):
    __tablename__ = "extra_attempts"
    
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    extra = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    material = relationship("Material", back_populates="extra_attempts")


class TestQuestion(Base):
    __tablename__ = "test_questions"
    
    id = Column(Integer, primary_key=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default="single")
    options = Column(Text)
    correct_answer = Column(Text)
    time_limit = Column(Integer, default=60)
    points = Column(Integer, default=1)
    order_num = Column(Integer, default=0)
    
    material = relationship("Material", back_populates="test_questions")


class TestResult(Base):
    __tablename__ = "test_results"
    
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    answers = Column(Text)
    auto_score = Column(Integer, default=0)
    max_score = Column(Integer, default=0)
    confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("User")
    material = relationship("Material", back_populates="test_results")
    submission = relationship("Submission", back_populates="test_results")


class PublicProfile(Base):
    __tablename__ = "public_profiles"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    bio = Column(Text)
    skills = Column(Text)
    contacts = Column(Text)
    is_public = Column(Boolean, default=False)
    show_courses = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User")


class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    status = Column(String, default="present")
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("User")
    group = relationship("Group", back_populates="attendances")


class ParentLink(Base):
    __tablename__ = "parent_links"
    
    id = Column(Integer, primary_key=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    parent = relationship("User", foreign_keys=[parent_id])
    student = relationship("User", foreign_keys=[student_id])


class CuratorLink(Base):
    __tablename__ = "curator_links"
    
    id = Column(Integer, primary_key=True)
    curator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    curator = relationship("User", foreign_keys=[curator_id])
    group = relationship("Group", back_populates="curators")