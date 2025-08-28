from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.database.db import get_db, get_session_local
from app.database.models import File, Summary, Assignment, Exam, Lectures
from .parser import Parser
from typing import List, Dict, Any
from datetime import time, date
import asyncio
import json
import os

import logging

router = APIRouter(prefix="/processing", tags=["processing"])

# In-memory status tracking (simple replacement for Redis)
_parsing_status = {}

def _status_key(file_id: int) -> str:
    return f"parse_status:{file_id}"

def _get_status(file_id: int) -> dict:
    """Get parsing status from memory"""
    return _parsing_status.get(_status_key(file_id), {})

def _set_status(file_id: int, status: str, progress: int, message: str):
    """Set parsing status in memory"""
    _parsing_status[_status_key(file_id)] = {
        "status": status,
        "progress": str(progress),
        "message": message
    }

@router.post("/parse/{file_id}")
async def parse_syllabus(file_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Runs parsing and reports status in memory."""
    # Validate file exists
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Initialize status
    _set_status(file_id, "queued", 0, "Queued for parsing")

    # Launch background task
    background_tasks.add_task(_run_parse_and_store, file_id)

    return {"status": "processing", "file_id": file_id}

async def trigger_parsing_for_file(file_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Helper function to trigger parsing for a file (used by other routes)"""
    # Validate file exists
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        return False

    # Initialize status
    _set_status(file_id, "queued", 0, "Queued for parsing")

    # Launch background task
    background_tasks.add_task(_run_parse_and_store, file_id)
    return True

def _run_parse_and_store(file_id: int) -> None:
    """Parses file, stores to DB, and updates status."""
    logger = logging.getLogger(__name__)
    logger.info(f"Starting parse and store for file {file_id}")
    
    def set_status(status: str, progress: int, message: str):
        _set_status(file_id, status, progress, message)
    
    def check_cancelled() -> bool:
        """Check if parsing has been cancelled or file has been deleted."""
        status_data = _get_status(file_id)
        if status_data.get("status") == "cancelled":
            return True
        try:
            SessionLocal = get_session_local()
            check_db = SessionLocal()
            file_exists = check_db.query(File).filter(File.id == file_id).first() is not None
            check_db.close()
            return not file_exists
        except Exception:
            return False

    set_status("started", 5, "Starting parse")
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        # Check for cancellation before starting
        if check_cancelled():
            logger.info(f"Parsing cancelled for file {file_id}")
            return
            
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            logger.error(f"File {file_id} not found in database")
            set_status("failed", 100, "File not found")
            return

        logger.info(f"Processing file {file_id}: {file.filename}")
        parser = Parser()
        set_status("extracting", 15, "Extracting text and calling AI")
        
        # Check for cancellation before AI processing
        if check_cancelled():
            logger.info(f"Parsing cancelled for file {file_id} before AI processing")
            return
            
        result = asyncio.run(parser.parse_syllabus(file.file_path))
        if not result.get("success"):
            logger.error(f"Parsing failed for file {file_id}: {result.get('error', 'Unknown error')}")
            set_status("failed", 100, f"Parsing failed: {result.get('error', 'Unknown error')}")
            return
        parsed_data = result.get("parsed", {})
        logger.info(f"Parsing completed for file {file_id}, extracted data: {list(parsed_data.keys())}")

        # Check for cancellation before saving
        if check_cancelled():
            logger.info(f"Parsing cancelled for file {file_id} before saving")
            return
            
        set_status("saving", 60, "Saving parsed data")

        # Summary
        if parsed_data.get("course_name") or parsed_data.get("instructor"):
            summary_text = f"Course: {parsed_data.get('course_name', 'N/A')}\nInstructor: {parsed_data.get('instructor', 'N/A')}"
            grading_breakdown = parsed_data.get("grading")  # Get grading data
            
            existing_summary = db.query(Summary).filter(Summary.file_id == file_id).first()
            if existing_summary:
                existing_summary.summary = summary_text
                existing_summary.grading_breakdown = grading_breakdown
                existing_summary.updated_at = func.now()
            else:
                db.add(Summary(
                    file_id=file_id, 
                    summary=summary_text, 
                    grading_breakdown=grading_breakdown,
                    confidence=85
                ))

        # Lectures
        if parsed_data.get("lectures"):
            db.query(Lectures).filter(Lectures.file_id == file_id).delete()
            for lecture_data in parsed_data["lectures"]:
                try:
                    day = lecture_data.get("day")
                    if isinstance(day, str):
                        day_map = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}
                        day = day_map.get(day.lower(), 0)
                    start_time = _parse_time(lecture_data.get("start_time", "09:00"))
                    end_time = _parse_time(lecture_data.get("end_time", "10:30"))
                    start_date = _parse_date(lecture_data.get("start_date", "2024-01-15"))
                    end_date = _parse_date(lecture_data.get("end_date", "2024-05-15"))
                    db.add(Lectures(
                        file_id=file_id,
                        day=day,
                        start_time=start_time,
                        end_time=end_time,
                        start_date=start_date,
                        end_date=end_date,
                        location=lecture_data.get("location", ""),
                        type=lecture_data.get("type", "lecture")
                    ))
                except Exception:
                    continue

        # Assignments
        if parsed_data.get("assignments"):
            db.query(Assignment).filter(Assignment.file_id == file_id).delete()
            for assignment_data in parsed_data["assignments"]:
                try:
                    due_date = _parse_date(assignment_data.get("parsed_date", "2024-01-15"))
                    # Parse time if provided
                    due_time = None
                    if assignment_data.get("parsed_time"):
                        due_time = _parse_time(assignment_data.get("parsed_time"))
                    
                    db.add(Assignment(
                        file_id=file_id,
                        due_date=due_date,
                        due_time=due_time,
                        description=assignment_data.get("description", ""),
                        confidence=assignment_data.get("confidence", 70)
                    ))
                except Exception:
                    continue

        # Exams
        if parsed_data.get("exams"):
            db.query(Exam).filter(Exam.file_id == file_id).delete()
            for exam_data in parsed_data["exams"]:
                try:
                    exam_date = _parse_date(exam_data.get("parsed_date", "2024-01-15"))
                    # Parse time if provided
                    exam_time = None
                    if exam_data.get("parsed_time"):
                        exam_time = _parse_time(exam_data.get("parsed_time"))
                    
                    db.add(Exam(
                        file_id=file_id,
                        exam_date=exam_date,
                        exam_time=exam_time,
                        description=exam_data.get("description", ""),
                        confidence=exam_data.get("confidence", 70)
                    ))
                except Exception:
                    continue

        db.commit()

        # Cache invalidation no longer needed (Redis removed)

        set_status("completed", 100, "Parsing completed")
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        set_status("failed", 100, f"Error: {str(e)}")
    finally:
        try:
            db.close()
        except Exception:
            pass

@router.get("/parse/{file_id}/status")
async def get_parsing_status(file_id: int):
    """Return current parsing status for a file from memory."""
    data = _get_status(file_id)
    if not data:
        return {"status": "unknown", "message": "No status found"}
    return data

@router.post("/parse/{file_id}/cancel")
async def cancel_parsing(file_id: int, db: Session = Depends(get_db)):
    """Cancel parsing for a file by setting status to cancelled and delete the file."""
    # Check if parsing is in progress
    status_data = _get_status(file_id)
    current_status = status_data.get("status")
    if not current_status or current_status in ["completed", "failed", "cancelled"]:
        return {"status": "error", "message": "Cannot cancel: parsing not in progress"}
    
    # Set status to cancelled
    _set_status(file_id, "cancelled", 0, "Parsing cancelled by user")
    
    # Delete the file from database (this will cascade delete all related data)
    try:
        file = db.query(File).filter(File.id == file_id).first()
        if file:
            filename = file.filename
            db.delete(file)
            db.commit()
            logging.getLogger(__name__).info(f"Deleted file {file_id} ({filename}) from database due to cancellation")
            
            return {
                "status": "cancelled", 
                "message": "Parsing cancelled and file deleted successfully"
            }
        else:
            return {"status": "cancelled", "message": "Parsing cancelled but file not found in database"}
    except Exception as e:
        # If database deletion fails, still report cancellation success
        logging.getLogger(__name__).error(f"Failed to delete file {file_id} from database: {e}")
        return {
            "status": "cancelled", 
            "message": "Parsing cancelled but file cleanup failed",
            "error": str(e)
        }

@router.get("/summary/{file_id}")
async def get_file_summary(file_id: int, db: Session = Depends(get_db)):
    """Get summary for a specific file"""
    try:
        # Get file from database
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get summary from database
        summary = db.query(Summary).filter(Summary.file_id == file_id).first()
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found for this file")
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "summary": summary.summary,
            "confidence": summary.confidence,
            "created_at": summary.created_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/grading/{file_id}")
async def get_grading_breakdown(file_id: int, db: Session = Depends(get_db)):
    """Get grading breakdown for a specific file"""
    try:
        # Get file from database
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get summary with grading breakdown from database
        summary = db.query(Summary).filter(Summary.file_id == file_id).first()
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found for this file")
        
        grading_data = summary.grading_breakdown
        if not grading_data:
            return {
                "file_id": file_id,
                "filename": file.filename,
                "message": "No grading information found for this file",
                "grading": None
            }
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "grading": grading_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/exams/{file_id}")
async def get_exam_dates(file_id: int, db: Session = Depends(get_db)):
    """Get exam dates for a specific file"""
    try:
        # Get file from database
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get exams from database
        exams = db.query(Exam).filter(
            Exam.file_id == file_id
        ).order_by(Exam.exam_date).all()
        
        if not exams:
            return {
                "file_id": file_id,
                "filename": file.filename,
                "message": "No exams found for this file",
                "exams": []
            }
        
        # Format the exam dates
        exam_list = []
        for exam in exams:
            exam_list.append({
                "id": exam.id,
                "description": exam.description,
                "exam_date": exam.parsed_date.isoformat(),
                "confidence": exam.confidence
            })
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "total_exams": len(exam_list),
            "exams": exam_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/assignments/{file_id}")
async def get_assignment_dates(file_id: int, db: Session = Depends(get_db)):
    """Get assignment dates for a specific file"""
    try:
        # Get file from database
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get assignments from database
        assignments = db.query(Assignment).filter(
            Assignment.file_id == file_id
        ).order_by(Assignment.due_date).all()
        
        if not assignments:
            return {
                "file_id": file_id,
                "filename": file.filename,
                "message": "No assignments found for this file",
                "assignments": []
            }
        
        # Format the assignment dates
        assignment_list = []
        for assignment in assignments:
            assignment_list.append({
                "id": assignment.id,
                "description": assignment.description,
                "due_date": assignment.parsed_date.isoformat(),
                "confidence": assignment.confidence
            })
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "total_assignments": len(assignment_list),
            "assignments": assignment_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/lectures/{file_id}")
async def get_lecture_schedule(file_id: int, db: Session = Depends(get_db)):
    """Get all lecture days, hours, and discussion sections for a specific file"""
    try:
        # Get file from database
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get lectures from database
        lectures = db.query(Lectures).filter(
            Lectures.file_id == file_id
        ).order_by(Lectures.day, Lectures.start_time).all()
        
        if not lectures:
            return {
                "file_id": file_id,
                "filename": file.filename,
                "message": "No lecture schedule found for this file",
                "lectures": [],
                "schedule": {},
                "by_type": {}
            }
        
        # Group lectures by day
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        schedule = {}
        
        # Group lectures by type
        by_type = {
            "lecture": [],
            "lab": [],
            "discussion": []
        }
        
        for lecture in lectures:
            day_name = days[lecture.day]
            if day_name not in schedule:
                schedule[day_name] = []
            
            lecture_data = {
                "id": lecture.id,
                "type": lecture.type or "lecture",  
                "start_time": lecture.start_time.isoformat(),
                "end_time": lecture.end_time.isoformat(),
                "start_date": lecture.start_date.isoformat(),
                "end_date": lecture.end_date.isoformat(),
                "location": lecture.location
            }
            
            schedule[day_name].append(lecture_data)
            
            # Add to type-specific lists
            lecture_type = lecture.type or "lecture"
            if lecture_type in by_type:
                by_type[lecture_type].append(lecture_data)
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "total_lectures": len(lectures),
            "schedule": schedule,
            "by_type": by_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/syllabus/{file_id}/all")
async def get_all_syllabus_data(file_id: int, db: Session = Depends(get_db)):
    """Return summary, exams, assignments, and lectures in one response."""

    # Build fresh response
    try:
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        # Summary
        summary = db.query(Summary).filter(Summary.file_id == file_id).first()
        summary_payload = None
        if summary:
            summary_payload = {
                "summary": summary.summary,
                "confidence": summary.confidence,
                "created_at": summary.created_at
            }

        # Exams
        exams_q = db.query(Exam).filter(Exam.file_id == file_id).order_by(Exam.exam_date).all()
        exams_payload = [
            {
                "id": exam.id,
                "description": exam.description,
                "exam_date": exam.exam_date.isoformat(),
                "confidence": exam.confidence
            }
            for exam in exams_q
        ]

        # Assignments
        assignments_q = db.query(Assignment).filter(Assignment.file_id == file_id).order_by(Assignment.due_date).all()
        assignments_payload = [
            {
                "id": a.id,
                "description": a.description,
                "due_date": a.due_date.isoformat(),
                "confidence": a.confidence
            }
            for a in assignments_q
        ]

        # Lectures
        lectures_q = db.query(Lectures).filter(Lectures.file_id == file_id).order_by(Lectures.day, Lectures.start_time).all()
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        schedule = {}
        by_type = {"lecture": [], "lab": [], "discussion": []}
        for lec in lectures_q:
            day_name = days[lec.day]
            schedule.setdefault(day_name, []).append({
                "id": lec.id,
                "type": lec.type or "lecture",
                "start_time": lec.start_time.isoformat(),
                "end_time": lec.end_time.isoformat(),
                "start_date": lec.start_date.isoformat(),
                "end_date": lec.end_date.isoformat(),
                "location": lec.location
            })
            t = lec.type or "lecture"
            if t in by_type:
                by_type[t].append(lec.id)

        payload = {
            "file_id": file_id,
            "filename": getattr(file, 'filename', ''),
            "summary": summary_payload,
            "exams": exams_payload,
            "assignments": assignments_payload,
            "lectures": {
                "schedule": schedule,
                "by_type": by_type,
                "total": len(lectures_q)
            }
        }

        # Caching removed (Redis no longer used)

        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

def _parse_time(time_str: str) -> time:
    """Parse time string to time object"""
    try:
        if ":" in time_str:
            hours, minutes = map(int, time_str.split(":"))
            return time(hour=hours, minute=minutes)
        else:
            # Handle formats like "9" or "14"
            hours = int(time_str)
            return time(hour=hours, minute=0)
    except:
        return time(hour=9, minute=0)  # Default to 9:00 AM

def _parse_date(date_str: str) -> date:
    """Parse date string to date object"""
    try:
        if "-" in date_str:
            year, month, day = map(int, date_str.split("-"))
            return date(year=year, month=month, day=day)
        else:
            # Handle other formats if needed
            return date(2024, 1, 15)  # Default date
    except:
        return date(2024, 1, 15)  # Default date