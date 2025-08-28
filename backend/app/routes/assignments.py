from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Assignment, File
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, date, time

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/assignments", tags=["assignments"])

# Pydantic models for Assignments
class AssignmentCreate(BaseModel):
    file_id: int
    due_date: date
    confidence: Optional[int] = None
    description: str

class AssignmentUpdate(BaseModel):
    due_date: Optional[date] = None
    confidence: Optional[int] = None
    description: Optional[str] = None

class AssignmentResponse(BaseModel):
    id: int
    file_id: int
    due_date: date
    due_time: Optional[time] = None
    confidence: Optional[int] = None
    description: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Assignment CRUD Operations

@router.post("/", response_model=AssignmentResponse, status_code=201)
async def create_assignment(
    assignment_data: AssignmentCreate,
    db: Session = Depends(get_db)
):
    """Create a new assignment"""
    try:
        # Check if file exists
        file = db.query(File).filter(File.id == assignment_data.file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Create new assignment
        new_assignment = Assignment(
            file_id=assignment_data.file_id,
            due_date=assignment_data.due_date,
            confidence=assignment_data.confidence,
            description=assignment_data.description
        )
        
        db.add(new_assignment)
        db.commit()
        db.refresh(new_assignment)
        
        logger.info(f"New assignment created for file {assignment_data.file_id}")
        return new_assignment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating assignment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create assignment")

@router.get("/", response_model=List[AssignmentResponse])
async def list_assignments(
    file_id: int = None,
    db: Session = Depends(get_db)
):
    """List assignments with optional filtering"""
    try:
        query = db.query(Assignment)
        
        if file_id:
            query = query.filter(Assignment.file_id == file_id)
        
        assignments = query.order_by(Assignment.due_date).all()
        return assignments
        
    except Exception as e:
        logger.error(f"Error listing assignments: {e}")
        raise HTTPException(status_code=500, detail="Failed to list assignments")

@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific assignment by ID"""
    try:
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        return assignment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting assignment {assignment_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get assignment")

@router.get("/file/{file_id}", response_model=List[AssignmentResponse])
async def get_assignments_by_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    """Get all assignments for a specific file"""
    try:
        assignments = db.query(Assignment).filter(Assignment.file_id == file_id).order_by(Assignment.due_date).all()
        return assignments
        
    except Exception as e:
        logger.error(f"Error getting assignments for file {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get assignments")

@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    assignment_data: AssignmentUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing assignment"""
    try:
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        # Update fields if provided
        if assignment_data.due_date is not None:
            assignment.due_date = assignment_data.due_date
        if assignment_data.confidence is not None:
            assignment.confidence = assignment_data.confidence
        if assignment_data.description is not None:
            assignment.description = assignment_data.description
        
        assignment.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(assignment)
        
        logger.info(f"Assignment {assignment_id} updated")
        return assignment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating assignment {assignment_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update assignment")

@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db)
):
    """Delete an assignment"""
    try:
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        db.delete(assignment)
        db.commit()
        
        logger.info(f"Assignment {assignment_id} deleted")
        return {"message": "Assignment deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting assignment {assignment_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete assignment")
