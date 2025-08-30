from pydantic import BaseModel
from typing import List, Optional

class Lecture(BaseModel):
    day: int  # 0=monday, 1=tuesday, etc.
    start_time: str  # HH:MM format (24-hour)
    end_time: str  # HH:MM format (24-hour)
    start_date: str  # YYYY-MM-DD format
    end_date: str  # YYYY-MM-DD format
    location: str
    type: str  # 'lecture', 'lab', 'discussion'

class Assignment(BaseModel):
    description: str
    date: str  # YYYY-MM-DD format or "Not Listed" if not listed
    time_due: str  # HH:MM format (24-hour) or "Not Listed" if not listed
    confidence: int  # 0-100

class Exam(BaseModel):
    description: str
    date: str  # YYYY-MM-DD format or "Not Listed" if not listed
    time_due: str  # HH:MM format (24-hour) or "Not Listed" if not listed
    confidence: int  # 0-100

class GradingCategory(BaseModel):
    name: str
    weight: float  
    description: str

class Grading(BaseModel):
    categories: List[GradingCategory]
    confidence: int  # 0-100

class SyllabusData(BaseModel):
    course_name: str
    instructor: str
    summary: str
    lectures: List[Lecture]
    assignments: List[Assignment]
    exams: List[Exam]
    grading: Optional[Grading]
