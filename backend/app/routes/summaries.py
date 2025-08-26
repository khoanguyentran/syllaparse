from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Summary, File
from pydantic import BaseModel
from typing import List
import logging
from datetime import datetime

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/summaries", tags=["summaries"])

# Pydantic models
class SummaryCreate(BaseModel):
    file_id: int
    summary: str
    confidence: int = None

class SummaryUpdate(BaseModel):
    summary: str = None
    confidence: int = None

class SummaryResponse(BaseModel):
    id: int
    file_id: int
    summary: str
    confidence: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# CRUD Operations

@router.post("/", response_model=SummaryResponse, status_code=201)
async def create_summary(
    summary_data: SummaryCreate,
    db: Session = Depends(get_db)
):
    """Create a new summary"""
    try:
        # Check if file exists
        file = db.query(File).filter(File.id == summary_data.file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check if summary already exists for this file
        existing_summary = db.query(Summary).filter(Summary.file_id == summary_data.file_id).first()
        if existing_summary:
            raise HTTPException(status_code=400, detail="Summary already exists for this file")
        
        # Create new summary
        new_summary = Summary(
            file_id=summary_data.file_id,
            summary=summary_data.summary,
            confidence=summary_data.confidence
        )
        
        db.add(new_summary)
        db.commit()
        db.refresh(new_summary)
        
        logger.info(f"New summary created for file {summary_data.file_id}")
        return new_summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating summary: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create summary")

@router.get("/{summary_id}", response_model=SummaryResponse)
async def get_summary(
    summary_id: int,
    db: Session = Depends(get_db)
):
    """Get summary by ID"""
    try:
        summary = db.query(Summary).filter(Summary.id == summary_id).first()
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to get summary")

@router.get("/file/{file_id}", response_model=SummaryResponse)
async def get_summary_by_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    """Get summary by file ID"""
    try:
        summary = db.query(Summary).filter(Summary.file_id == file_id).first()
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found for this file")
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting summary by file: {e}")
        raise HTTPException(status_code=500, detail="Failed to get summary")

@router.put("/{summary_id}", response_model=SummaryResponse)
async def update_summary(
    summary_id: int,
    summary_data: SummaryUpdate,
    db: Session = Depends(get_db)
):
    """Update summary"""
    try:
        summary = db.query(Summary).filter(Summary.id == summary_id).first()
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")
        
        # Update fields if provided
        if summary_data.summary is not None:
            summary.summary = summary_data.summary
        if summary_data.confidence is not None:
            summary.confidence = summary_data.confidence
        
        summary.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(summary)
        
        logger.info(f"Summary updated: {summary_id}")
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating summary: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update summary")

@router.delete("/{summary_id}")
async def delete_summary(
    summary_id: int,
    db: Session = Depends(get_db)
):
    """Delete summary by ID"""
    try:
        summary = db.query(Summary).filter(Summary.id == summary_id).first()
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")
        
        db.delete(summary)
        db.commit()
        
        logger.info(f"Summary deleted: {summary_id}")
        return {"message": "Summary deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting summary: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete summary")
