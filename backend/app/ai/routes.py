from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database.db import get_db
from app.database.models import User, File
from .syllabus_parser import SyllabusParser
from .llm_client import LLMClient
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/parse-syllabus")
async def parse_syllabus(
    file_id: int,
    db: Session = Depends(get_db)
):
    """Parse a syllabus file using AI"""
    try:
        # Get file from database
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Initialize parser
        parser = SyllabusParser()
        
        # Parse the syllabus
        result = await parser.parse_syllabus(file.filepath, "pdf")  # Assuming PDF for now
        
        return {
            "message": "Syllabus parsed successfully",
            "file_id": file_id,
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error parsing syllabus: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-assignments")
async def extract_assignments(
    file_id: int,
    db: Session = Depends(get_db)
):
    """Extract assignments from a syllabus file"""
    try:
        # Get file from database
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Initialize parser
        parser = SyllabusParser()
        
        # Process document to get text
        doc_processor = parser.doc_processor
        doc_data = await doc_processor.process_document(file.filepath, "pdf")
        
        # Extract assignments
        assignments = await parser.extract_assignments(doc_data["full_text"])
        
        return {
            "message": "Assignments extracted successfully",
            "file_id": file_id,
            "assignments": assignments
        }
        
    except Exception as e:
        logger.error(f"Error extracting assignments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-course-info")
async def extract_course_info(
    file_id: int,
    db: Session = Depends(get_db)
):
    """Extract basic course information from a syllabus file"""
    try:
        # Get file from database
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Initialize parser
        parser = SyllabusParser()
        
        # Process document to get text
        doc_processor = parser.doc_processor
        doc_data = await doc_processor.process_document(file.filepath, "pdf")
        
        # Extract course info
        course_info = await parser.extract_course_info(doc_data["full_text"])
        
        return {
            "message": "Course information extracted successfully",
            "file_id": file_id,
            "course_info": course_info
        }
        
    except Exception as e:
        logger.error(f"Error extracting course info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def ai_health_check():
    """Check if AI services are available"""
    try:
        llm_client = LLMClient()
        is_available = llm_client.is_available()
        
        return {
            "status": "healthy" if is_available else "unavailable",
            "llm_available": is_available,
            "message": "AI services are available" if is_available else "No LLM API keys configured"
        }
        
    except Exception as e:
        logger.error(f"AI health check error: {e}")
        return {
            "status": "error",
            "llm_available": False,
            "message": str(e)
        }
