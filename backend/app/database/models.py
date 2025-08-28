from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Date, ForeignKey, CheckConstraint, Time, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.db import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String(255), unique=True, nullable=False, index=True)  # Google's unique user ID
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    role = Column(String(20), default='user')
    
    # Relationships
    files = relationship("File", back_populates="user", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        CheckConstraint(role.in_(['admin', 'user']), name='valid_role'),
    )

class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="files")
    summary = relationship("Summary", back_populates="file", uselist=False, cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="file", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="file", cascade="all, delete-orphan")
    lectures = relationship("Lectures", back_populates="file", cascade="all, delete-orphan")

class Summary(Base):
    __tablename__ = "summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    confidence = Column(Integer, nullable=True)
    grading_breakdown = Column(JSON, nullable=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    file = relationship("File", back_populates="summary")
    
    # Constraints
    __table_args__ = (
        CheckConstraint(confidence >= 0, name='confidence_min'),
        CheckConstraint(confidence <= 100, name='confidence_max'),
    )

class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False, index=True)
    due_date = Column(Date, nullable=False)
    due_time = Column(Time, nullable=True) 
    confidence = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    description = Column(String(255), nullable=False)
    
    # Relationships
    file = relationship("File", back_populates="assignments")
    
    # Constraints
    __table_args__ = (
        CheckConstraint(confidence >= 0, name='confidence_min'),
        CheckConstraint(confidence <= 100, name='confidence_max'),
    )

class Exam(Base):
    __tablename__ = "exams"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False, index=True)
    exam_date = Column(Date, nullable=False)
    exam_time = Column(Time, nullable=True)  
    confidence = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    description = Column(String(255), nullable=False)
    
    # Relationships
    file = relationship("File", back_populates="exams")
    
    # Constraints
    __table_args__ = (
        CheckConstraint(confidence >= 0, name='confidence_min'),
        CheckConstraint(confidence <= 100, name='confidence_max'),
    )

class Lectures(Base):
    __tablename__ = "lectures"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False, index=True)
    day = Column(Integer, nullable=False)  # 0 = monday, 1 = tuesday, etc.
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    location = Column(String(255), nullable=True)
    type = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    file = relationship("File", back_populates="lectures")
    
    # Constraints
    __table_args__ = (
        CheckConstraint(day >= 0, name='day_min'),
        CheckConstraint(day <= 6, name='day_max'),
        CheckConstraint(start_date <= end_date, name='valid_date_range'),
        CheckConstraint(type.in_(['lab', 'lecture', 'discussion']), name='valid_lecture_type'),
    )
