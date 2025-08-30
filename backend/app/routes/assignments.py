from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Assignment, File
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, date as Date, time
import uuid

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/assignments", tags=["assignments"])

# Pydantic models for Assignments
class AssignmentCreate(BaseModel):
    file_id: str  # UUID as string
    date: Date
    confidence: Optional[int] = None
    description: str

class AssignmentUpdate(BaseModel):
    date: Optional[Date] = None
    confidence: Optional[int] = None
    description: Optional[str] = None

class AssignmentResponse(BaseModel):
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
            date=assignment_data.date,
            confidence=assignment_data.confidence,
            description=assignment_data.description
        )
        
        db.add(new_assignment)
        db.commit()
        db.refresh(new_assignment)
        
        logger.info(f"New assignment created for file {assignment_data.file_id}")
        
        # Convert UUID object to string for Pydantic response
        assignment_dict = {
            "id": new_assignment.id,
            "file_id": str(new_assignment.file_id),  # Convert UUID to string
            "date": new_assignment.date,
            "time_due": new_assignment.time_due,
            "confidence": new_assignment.confidence,
            "description": new_assignment.description,
            "created_at": new_assignment.created_at,
            "updated_at": new_assignment.updated_at
        }
        
        return assignment_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating assignment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create assignment")

@router.get("/", response_model=List[AssignmentResponse])
async def list_assignments(
    file_id: str = None,
    db: Session = Depends(get_db)
):
    """List assignments with optional filtering"""
    try:
        query = db.query(Assignment)
        
        if file_id:
            try:
                file_uuid = uuid.UUID(file_id)
                query = query.filter(Assignment.file_id == file_uuid)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid file ID format")
        
        assignments = query.order_by(Assignment.date).all()
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
        
        # Convert UUID object to string for Pydantic response
        assignment_dict = {
            "id": assignment.id,
            "file_id": str(assignment.file_id),  # Convert UUID to string
            "date": assignment.date,
            "time_due": assignment.time_due,
            "confidence": assignment.confidence,
            "description": assignment.description,
            "created_at": assignment.created_at,
            "updated_at": assignment.updated_at
        }
        
        return assignment_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting assignment {assignment_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get assignment")

@router.get("/file/{file_id}", response_model=List[AssignmentResponse])
async def get_assignments_by_file(
    file_id: str,
    db: Session = Depends(get_db)
):
    """Get all assignments for a specific file"""
    try:
        # Validate UUID format
        try:
            file_uuid = uuid.UUID(file_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid file ID format")
        
        assignments = db.query(Assignment).filter(Assignment.file_id == file_uuid).order_by(Assignment.date).all()
        
        # Convert UUID objects to strings for Pydantic response
        assignment_responses = []
        for assignment in assignments:
            assignment_dict = {
                "id": assignment.id,
                "file_id": str(assignment.file_id),  # Convert UUID to string
                "date": assignment.date,
                "time_due": assignment.time_due,
                "confidence": assignment.confidence,
                "description": assignment.description,
                "created_at": assignment.created_at,
                "updated_at": assignment.updated_at
            }
            assignment_responses.append(assignment_dict)
        
        return assignment_responses
        
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
        if assignment_data.date is not None:
            assignment.date = assignment_data.date
        if assignment_data.confidence is not None:
            assignment.confidence = assignment_data.confidence
        if assignment_data.description is not None:
            assignment.description = assignment_data.description
        
        assignment.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(assignment)
        
        logger.info(f"Assignment {assignment_id} updated")
        
        # Convert UUID object to string for Pydantic response
        assignment_dict = {
            "id": assignment.id,
            "file_id": str(assignment.file_id),  # Convert UUID to string
            "date": assignment.date,
            "time_due": assignment.time_due,
            "confidence": assignment.confidence,
            "description": assignment.description,
            "created_at": assignment.created_at,
            "updated_at": assignment.updated_at
        }
        
        return assignment_dict
        
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
