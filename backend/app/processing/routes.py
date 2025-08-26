from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import File
from .parser import Parser

router = APIRouter(prefix="/processing", tags=["processing"])

@router.post("/parse/{file_id}")
async def parse_syllabus(file_id: int, db: Session = Depends(get_db)):
    """Parse a syllabus file using GPT"""
    try:
        # Get file from database
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Parse with GPT
        parser = Parser()
        result = await parser.parse_syllabus(file.filepath)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))