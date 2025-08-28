import fitz  # PyMuPDF
from google.cloud import storage
from io import BytesIO
from .config import OPENAI_API_KEY, DEFAULT_MODEL, MAX_TOKENS
from openai import OpenAI
from .types import SyllabusData

class Parser:
    """Parser for syllabus data"""
    
    def __init__(self):
        self.openai_key = OPENAI_API_KEY
    
    async def parse_syllabus(self, file_url: str) -> dict:
        """Parse PDF from URL and extract info using GPT"""
        try:
            text = await self._extract_text(file_url)
            
            # Parse with GPT
            raw_result = await self._gpt_parse(text)
            
            # Check if GPT parsing failed
            if "error" in raw_result:
                return {
                    "success": False,
                    "error": raw_result["error"],
                    "text": text[:500] + "..." if len(text) > 500 else text
                }
            
            # Validate and clean the parsed data
            validated_result = self._validate_parsed_data(raw_result)
            
            if "error" in validated_result:
                return {
                    "success": False,
                    "error": validated_result["error"],
                    "text": text[:500] + "..." if len(text) > 500 else text
                }
            
            return {
                "success": True,
                "text": text[:500] + "..." if len(text) > 500 else text,
                "parsed": validated_result
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _extract_text(self, gcs_url: str) -> str:
        """Extract text from PDF in Google Cloud Storage"""
        try:
            # Format: https://storage.googleapis.com/BUCKET_NAME/PATH/TO/FILE
            if "storage.googleapis.com" in gcs_url:
                parts = gcs_url.replace("https://storage.googleapis.com/", "").split("/", 1)
                bucket_name = parts[0]
                blob_name = parts[1] if len(parts) > 1 else ""
            else:
                raise ValueError("Invalid GCS URL format")
            
            client = storage.Client()
            bucket = client.bucket(bucket_name)
            blob = bucket.blob(blob_name)
            
            content = blob.download_as_bytes()
            
            doc = fitz.open(stream=BytesIO(content), filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            
            return text
            
        except Exception as e:
            raise Exception(f"Failed to extract text from GCS: {str(e)}")
    
    async def _gpt_parse(self, text: str) -> dict:
        """Use GPT to parse syllabus text using structured output"""
        if not self.openai_key:
            return {"error": "OpenAI API key not configured"}
        
        prompt = f"""
            ## GOAL
            Parse a university syllabus document to extract structured information about course schedules, assignments, exams, grading policies, and overall course summary. Transform unstructured syllabus text into organized, machine-readable data with confidence scores.

            ## RETURN FORMAT
            You must return data that matches the SyllabusData schema with these components:
            - course_name: Full course title and number
            - instructor: Professor's name and contact info
            - summary: A paragraph of the course description covering course code, professor's name, topics, objectives, prerequisites, and other relevant information
            - lectures: Array of meeting times with day (0-6), start_time, end_time, dates, location, type
            - assignments: Array with description (assignment name and number only), parsed_date, parsed_time, confidence
            - exams: Array with description, parsed_date, parsed_time, confidence  
            - grading: Object with categories array (name, weight, description) and confidence

            ## WARNINGS AND CONSTRAINTS
            CRITICAL - Follow these rules strictly:
            - NEVER guess dates, times, or locations - use confidence=50 for uncertain information
            - Day numbers: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
            - Time format: 24-hour "HH:MM" (e.g., "14:30" not "2:30 PM")
            - Date format: "YYYY-MM-DD" only
            - parsed_time for assignments/exams: Use "HH:MM" format if due time is specified, empty string "" if only date is given
            - Confidence scores: 85=confident, 70=somewhat confident, 50=uncertain
            - Default lecture type to "lecture" if unclear
            - Date pattern handling: If specific dates aren't listed and only days of the week and times are provided:
              * Fall semester classes: repeat on those days every week for August, September, October, November, December
              * Spring semester classes: repeat on those days every week for January, February, March, April, May

            ## CONTEXT AND EXAMPLES
            Lecture Type Classification:
            - "lecture": Regular class sessions, main course meetings, instructor presentations
            - "lab": Laboratory sessions, computer labs, studio time
            - "discussion": Discussion sections, recitations, seminars

            Classification Examples:
            - "Class meets MWF 9:00-10:30" → type: "lecture"
            - "Lab sessions Tuesdays 2:00-5:00" → type: "lab"  
            - "Discussion sections Thursdays 3:00-4:00" → type: "discussion"
            - "Recitation Fridays 1:00-2:00" → type: "discussion"
            - "Studio time Wednesdays 6:00-9:00" → type: "lab"

            Course Summary Guidelines:
            Extract a paragraph description that includes:
            - Course code and number
            - Professors name and contact info
            - Main course topics and subject matter
            - Learning objectives or goals
            - Grading policies and late submission policies
            - Grading scale (e.g. A+ is 90-100, A is 80-89, etc.)
            - Prerequisites or required background
            Look for sections like: "Course Description", "Overview", "Introduction", "About this Course", "Learning Objectives"

            Assignment Description Guidelines:
            Keep assignment descriptions concise with ONLY the name and number:
            - "Assignment 1" not "Assignment 1 (detailed instructions about submission via GitHub...)"
            - "Lab Assignment 2" not "Lab Assignment 2 (part of 4 incremental RTL lab assignments). Code submitted via GitHub; lab report (PDF...)"
            - "Weekly Quiz 3" not "Weekly online quizzes (timed, typically on Mondays, ≤20 minutes). Lowest quiz score dropped..."
            - "Project Proposal" not "Project Proposal - Submit a 2-page proposal outlining your final project idea..."
            
            Grading Information Sources:
            Look for these section headers: "Grading", "Grade Distribution", "Assessment", "Evaluation", "Weights"
            Common categories: Assignments, Homework, Projects, Exams, Midterm, Final, Participation, Attendance, Quizzes, Lab Work

            ## SYLLABUS TEXT TO ANALYZE
            {text}
        """
        
        return await self._run_llm(prompt)
    
    async def _run_llm(self, prompt: str) -> dict:
        """Call OpenAI GPT API with structured output"""
        try:
            client = OpenAI(api_key=self.openai_key)
            
            response = client.beta.chat.completions.parse(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": "You are a professor with 20+ years of experience creating syllabi. You understand all syllabi terminology and can perfectly understand other professor's syllabi."},
                    {"role": "user", "content": prompt}
                ],
                response_format=SyllabusData,
                max_completion_tokens=MAX_TOKENS
            )
            
            result = response.choices[0].message.parsed
            if result:
                return result.model_dump()
            else:
                return {"error": "No parsed result returned"}
            
        except Exception as e:
            return {"error": f"GPT error: {str(e)}"}
    

    def _validate_parsed_data(self, data: dict) -> dict:
        """Validate and clean parsed data - simplified since structured output handles most validation"""
        if not isinstance(data, dict):
            return {"error": "Parsed data is not a dictionary"}
        
        if data.get("grading") and data["grading"].get("categories"):
            total_weight = sum(cat["weight"] for cat in data["grading"]["categories"] if cat.get("weight"))
            data["grading"]["total_weight"] = total_weight
        
        return data
