from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Date, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.db import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
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
    assignments_exams = relationship("AssignmentExam", back_populates="file", cascade="all, delete-orphan")

class Summary(Base):
    __tablename__ = "summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    confidence = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    file = relationship("File", back_populates="summary")
    
    # Constraints
    __table_args__ = (
        CheckConstraint(confidence >= 0, name='confidence_min'),
        CheckConstraint(confidence <= 100, name='confidence_max'),
    )

class AssignmentExam(Base):
    __tablename__ = "assignments_exams"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False, index=True)
    parsed_date = Column(Date, nullable=False)
    confidence = Column(Integer, nullable=True)
    type = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    description = Column(String(255), nullable=False)
    
    # Relationships
    file = relationship("File", back_populates="assignments_exams")
    
    # Constraints
    __table_args__ = (
        CheckConstraint(type.in_(['assignment', 'exam']), name='valid_type'),
        CheckConstraint(confidence >= 0, name='confidence_min'),
        CheckConstraint(confidence <= 100, name='confidence_max'),
    )
