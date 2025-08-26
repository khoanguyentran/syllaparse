from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import AssignmentExam, File
from pydantic import BaseModel
from typing import List
import logging
from datetime import datetime, date

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/assignments-exams", tags=["assignments-exams"])

# Pydantic models
class AssignmentExamCreate(BaseModel):
    file_id: int
    parsed_date: date
    confidence: int = None
    type: str  # 'assignment' or 'exam'
    description: str

class AssignmentExamUpdate(BaseModel):
    parsed_date: date = None
    confidence: int = None
    type: str = None
    description: str = None

class AssignmentExamResponse(BaseModel):
    id: int
    file_id: int
    parsed_date: date
    confidence: int
    type: str
    description: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# CRUD Operations

@router.post("/", response_model=AssignmentExamResponse, status_code=201)
async def create_assignment_exam(
    assignment_data: AssignmentExamCreate,
    db: Session = Depends(get_db)
):
    """Create a new assignment or exam"""
    try:
        # Check if file exists
        file = db.query(File).filter(File.id == assignment_data.file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Validate type
        if assignment_data.type not in ['assignment', 'exam']:
            raise HTTPException(status_code=400, detail="Type must be 'assignment' or 'exam'")
        
        # Create new assignment/exam
        new_assignment = AssignmentExam(
            file_id=assignment_data.file_id,
            parsed_date=assignment_data.parsed_date,
            confidence=assignment_data.confidence,
            type=assignment_data.type,
            description=assignment_data.description
        )
        
        db.add(new_assignment)
        db.commit()
        db.refresh(new_assignment)
        
        logger.info(f"New {assignment_data.type} created for file {assignment_data.file_id}")
        return new_assignment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating assignment/exam: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create assignment/exam")

@router.get("/", response_model=List[AssignmentExamResponse])
async def list_assignments_exams(
    file_id: int = None,
    type: str = None,
    db: Session = Depends(get_db)
):
    """List assignments/exams with optional filtering"""
    try:
        query = db.query(AssignmentExam)
        
        if file_id:
            query = query.filter(AssignmentExam.file_id == file_id)
        
        if type:
            if type not in ['assignment', 'exam']:
                raise HTTPException(status_code=400, detail="Type must be 'assignment' or 'exam'")
            query = query.filter(AssignmentExam.type == type)
        
        assignments = query.order_by(AssignmentExam.parsed_date).all()
        return assignments
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing assignments/exams: {e}")
        raise HTTPException(status_code=500, detail="Failed to list assignments/exams")

@router.get("/{assignment_id}", response_model=AssignmentExamResponse)
async def get_assignment_exam(
    assignment_id: int,
    db: Session = Depends(get_db)
):
    """Get assignment/exam by ID"""
    try:
        assignment = db.query(AssignmentExam).filter(AssignmentExam.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment/Exam not found")
        
        return assignment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting assignment/exam: {e}")
        raise HTTPException(status_code=500, detail="Failed to get assignment/exam")

@router.get("/file/{file_id}", response_model=List[AssignmentExamResponse])
async def get_assignments_exams_by_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    """Get all assignments/exams for a specific file"""
    try:
        assignments = db.query(AssignmentExam).filter(AssignmentExam.file_id == file_id).order_by(AssignmentExam.parsed_date).all()
        return assignments
        
    except Exception as e:
        logger.error(f"Error getting assignments/exams by file: {e}")
        raise HTTPException(status_code=500, detail="Failed to get assignments/exams")

@router.put("/{assignment_id}", response_model=AssignmentExamResponse)
async def update_assignment_exam(
    assignment_id: int,
    assignment_data: AssignmentExamUpdate,
    db: Session = Depends(get_db)
):
    """Update assignment/exam"""
    try:
        assignment = db.query(AssignmentExam).filter(AssignmentExam.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment/Exam not found")
        
        # Update fields if provided
        if assignment_data.parsed_date is not None:
            assignment.parsed_date = assignment_data.parsed_date
        if assignment_data.confidence is not None:
            assignment.confidence = assignment_data.confidence
        if assignment_data.type is not None:
            if assignment_data.type not in ['assignment', 'exam']:
                raise HTTPException(status_code=400, detail="Type must be 'assignment' or 'exam'")
            assignment.type = assignment_data.type
        if assignment_data.description is not None:
            assignment.description = assignment_data.description
        
        assignment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(assignment)
        
        logger.info(f"Assignment/Exam updated: {assignment_id}")
        return assignment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating assignment/exam: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update assignment/exam")

@router.delete("/{assignment_id}")
async def delete_assignment_exam(
    assignment_id: int,
    db: Session = Depends(get_db)
):
    """Delete assignment/exam by ID"""
    try:
        assignment = db.query(AssignmentExam).filter(AssignmentExam.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment/Exam not found")
        
        db.delete(assignment)
        db.commit()
        
        logger.info(f"Assignment/Exam deleted: {assignment_id}")
        return {"message": "Assignment/Exam deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting assignment/exam: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete assignment/exam")
