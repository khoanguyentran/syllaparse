from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Exam, File
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, date as Date, time
import uuid

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/exams", tags=["exams"])

# Pydantic models for Exams
class ExamCreate(BaseModel):
    file_id: str  # UUID as string
    date: Date
    confidence: Optional[int] = None
    description: str

class ExamUpdate(BaseModel):
    date: Optional[Date] = None
    confidence: Optional[int] = None
    description: Optional[str] = None

class ExamResponse(BaseModel):
    id: int
    file_id: str  # UUID as string
    date: Date
    time_due: Optional[time] = None
    confidence: Optional[int] = None
    description: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Exam CRUD Operations

@router.post("/", response_model=ExamResponse, status_code=201)
async def create_exam(
    exam_data: ExamCreate,
    db: Session = Depends(get_db)
):
    """Create a new exam"""
    try:
        # Check if file exists
        file = db.query(File).filter(File.id == exam_data.file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Create new exam
        new_exam = Exam(
            file_id=exam_data.file_id,
            date=exam_data.date,
            confidence=exam_data.confidence,
            description=exam_data.description
        )
        
        db.add(new_exam)
        db.commit()
        db.refresh(new_exam)
        
        logger.info(f"New exam created for file {exam_data.file_id}")
        
        # Convert UUID object to string for Pydantic response
        exam_dict = {
            "id": new_exam.id,
            "file_id": str(new_exam.file_id),  # Convert UUID to string
            "date": new_exam.date,
            "time_due": new_exam.time_due,
            "confidence": new_exam.confidence,
            "description": new_exam.description,
            "created_at": new_exam.created_at,
            "updated_at": new_exam.updated_at
        }
        
        return exam_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating exam: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create exam")

@router.get("/", response_model=List[ExamResponse])
async def list_exams(
    file_id: int = None,
    db: Session = Depends(get_db)
):
    """List exams with optional filtering"""
    try:
        query = db.query(Exam)
        
        if file_id:
            query = query.filter(Exam.file_id == file_id)
        
        exams = query.order_by(Exam.date).all()
        return exams
        
    except Exception as e:
        logger.error(f"Error listing exams: {e}")
        raise HTTPException(status_code=500, detail="Failed to list exams")

@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific exam by ID"""
    try:
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        # Convert UUID object to string for Pydantic response
        exam_dict = {
            "id": exam.id,
            "file_id": str(exam.file_id),  # Convert UUID to string
            "date": exam.date,
            "time_due": exam.time_due,
            "confidence": exam.confidence,
            "description": exam.description,
            "created_at": exam.created_at,
            "updated_at": exam.updated_at
        }
        
        return exam_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting exam {exam_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get exam")

@router.get("/file/{file_id}", response_model=List[ExamResponse])
async def get_exams_by_file(
    file_id: str,
    db: Session = Depends(get_db)
):
    """Get all exams for a specific file"""
    try:
        # Validate UUID format
        try:
            file_uuid = uuid.UUID(file_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid file ID format")
        
        exams = db.query(Exam).filter(Exam.file_id == file_uuid).order_by(Exam.date).all()
        
        # Convert UUID objects to strings for Pydantic response
        exam_responses = []
        for exam in exams:
            exam_dict = {
                "id": exam.id,
                "file_id": str(exam.file_id),  # Convert UUID to string
                "date": exam.date,
                "time_due": exam.time_due,
                "confidence": exam.confidence,
                "description": exam.description,
                "created_at": exam.created_at,
                "updated_at": exam.updated_at
            }
            exam_responses.append(exam_dict)
        
        return exam_responses
        
    except Exception as e:
        logger.error(f"Error getting exams for file {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get exams")

@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: int,
    exam_data: ExamUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing exam"""
    try:
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        # Update fields if provided
        if exam_data.date is not None:
            exam.date = exam_data.date
        if exam_data.confidence is not None:
            exam.confidence = exam_data.confidence
        if exam_data.description is not None:
            exam.description = exam_data.description
        
        exam.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(exam)
        
        logger.info(f"Exam {exam_id} updated")
        
        # Convert UUID object to string for Pydantic response
        exam_dict = {
            "id": exam.id,
            "file_id": str(exam.file_id),  # Convert UUID to string
            "date": exam.date,
            "time_due": exam.time_due,
            "confidence": exam.confidence,
            "description": exam.description,
            "created_at": exam.created_at,
            "updated_at": exam.updated_at
        }
        
        return exam_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating exam {exam_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update exam")

@router.delete("/{exam_id}")
async def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db)
):
    """Delete an exam"""
    try:
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        db.delete(exam)
        db.commit()
        
        logger.info(f"Exam {exam_id} deleted")
        return {"message": "Exam deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting exam {exam_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete exam")
