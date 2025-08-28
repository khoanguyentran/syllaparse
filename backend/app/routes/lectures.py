from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Lectures, File
from pydantic import BaseModel
from typing import List
import logging
from datetime import datetime, date, time

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/lectures", tags=["lectures"])

# Pydantic models
class LectureCreate(BaseModel):
    file_id: int
    day: int  # 0 = monday, 1 = tuesday, etc.
    start_time: time
    end_time: time
    start_date: date
    end_date: date
    location: str = None
    type: str = 'lecture'  # 'lecture', 'lab', 'discussion'

class LectureUpdate(BaseModel):
    day: int = None
    start_time: time = None
    end_time: time = None
    start_date: date = None
    end_date: date = None
    location: str = None
    type: str = None  # 'lecture', 'lab', 'discussion'

class LectureResponse(BaseModel):
    id: int
    file_id: int
    day: int
    start_time: time
    end_time: time
    start_date: date
    end_date: date
    location: str
    type: str  # 'lecture', 'lab', 'discussion'
    created_at: datetime

    class Config:
        from_attributes = True

# CRUD Operations

@router.post("/", response_model=LectureResponse, status_code=201)
async def create_lecture(
    lecture_data: LectureCreate,
    db: Session = Depends(get_db)
):
    """Create a new lecture"""
    try:
        # Check if file exists
        file = db.query(File).filter(File.id == lecture_data.file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Validate day (0-6 for Monday-Sunday)
        if not 0 <= lecture_data.day <= 6:
            raise HTTPException(status_code=400, detail="Day must be between 0 (Monday) and 6 (Sunday)")
        
        # Validate date range
        if lecture_data.start_date > lecture_data.end_date:
            raise HTTPException(status_code=400, detail="Start date must be before or equal to end date")
        
        # Validate time range
        if lecture_data.start_time >= lecture_data.end_time:
            raise HTTPException(status_code=400, detail="Start time must be before end time")
        
        # Create new lecture
        new_lecture = Lectures(
            file_id=lecture_data.file_id,
            day=lecture_data.day,
            start_time=lecture_data.start_time,
            end_time=lecture_data.end_time,
            start_date=lecture_data.start_date,
            end_date=lecture_data.end_date,
            location=lecture_data.location,
            type=lecture_data.type
        )
        
        db.add(new_lecture)
        db.commit()
        db.refresh(new_lecture)
        
        logger.info(f"New lecture created for file {lecture_data.file_id}")
        return new_lecture
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating lecture: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create lecture")

@router.get("/", response_model=List[LectureResponse])
async def list_lectures(
    file_id: int = None,
    day: int = None,
    db: Session = Depends(get_db)
):
    """List lectures with optional filtering"""
    try:
        query = db.query(Lectures)
        
        if file_id:
            query = query.filter(Lectures.file_id == file_id)
        
        if day is not None:
            if not 0 <= day <= 6:
                raise HTTPException(status_code=400, detail="Day must be between 0 (Monday) and 6 (Sunday)")
            query = query.filter(Lectures.day == day)
        
        lectures = query.order_by(Lectures.day, Lectures.start_time).all()
        return lectures
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing lectures: {e}")
        raise HTTPException(status_code=500, detail="Failed to list lectures")

@router.get("/{lecture_id}", response_model=LectureResponse)
async def get_lecture(
    lecture_id: int,
    db: Session = Depends(get_db)
):
    """Get lecture by ID"""
    try:
        lecture = db.query(Lectures).filter(Lectures.id == lecture_id).first()
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        return lecture
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lecture: {e}")
        raise HTTPException(status_code=500, detail="Failed to get lecture")

@router.get("/file/{file_id}", response_model=List[LectureResponse])
async def get_lectures_by_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    """Get all lectures for a specific file"""
    try:
        lectures = db.query(Lectures).filter(Lectures.file_id == file_id).order_by(Lectures.day, Lectures.start_time).all()
        return lectures
        
    except Exception as e:
        logger.error(f"Error getting lectures by file: {e}")
        raise HTTPException(status_code=500, detail="Failed to get lectures")

@router.put("/{lecture_id}", response_model=LectureResponse)
async def update_lecture(
    lecture_id: int,
    lecture_data: LectureUpdate,
    db: Session = Depends(get_db)
):
    """Update lecture"""
    try:
        lecture = db.query(Lectures).filter(Lectures.id == lecture_id).first()
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        # Update fields if provided
        if lecture_data.day is not None:
            if not 0 <= lecture_data.day <= 6:
                raise HTTPException(status_code=400, detail="Day must be between 0 (Monday) and 6 (Sunday)")
            lecture.day = lecture_data.day
        
        if lecture_data.start_time is not None:
            lecture.start_time = lecture_data.start_time
        
        if lecture_data.end_time is not None:
            lecture.end_time = lecture_data.end_time
        
        if lecture_data.start_date is not None:
            lecture.start_date = lecture_data.start_date
        
        if lecture_data.end_date is not None:
            lecture.end_date = lecture_data.end_date
        
        if lecture_data.location is not None:
            lecture.location = lecture_data.location
        
        if lecture_data.type is not None:
            lecture.type = lecture_data.type
        
        # Validate updated data
        if lecture.start_date > lecture.end_date:
            raise HTTPException(status_code=400, detail="Start date must be before or equal to end date")
        
        if lecture.start_time >= lecture.end_time:
            raise HTTPException(status_code=400, detail="Start time must be before end time")
        
        db.commit()
        db.refresh(lecture)
        
        logger.info(f"Lecture updated: {lecture_id}")
        return lecture
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating lecture: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update lecture")

@router.delete("/{lecture_id}")
async def delete_lecture(
    lecture_id: int,
    db: Session = Depends(get_db)
):
    """Delete lecture by ID"""
    try:
        lecture = db.query(Lectures).filter(Lectures.id == lecture_id).first()
        if not lecture:
            raise HTTPException(status_code=404, detail="Lecture not found")
        
        db.delete(lecture)
        db.commit()
        
        logger.info(f"Lecture deleted: {lecture_id}")
        return {"message": "Lecture deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting lecture: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete lecture")
