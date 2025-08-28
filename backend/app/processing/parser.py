import fitz  # PyMuPDF
from google.cloud import storage
from io import BytesIO
import json
from .config import OPENAI_API_KEY, DEFAULT_MODEL, MAX_TOKENS
from openai import OpenAI

class Parser:
    """Simple PDF parser"""
    
    def __init__(self):
        self.openai_key = OPENAI_API_KEY
    
    async def parse_syllabus(self, file_url: str) -> dict:
        """Parse PDF from URL and extract info using GPT"""
        try:
            # Download and extract text
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
        """Use GPT to parse syllabus text"""
        if not self.openai_key:
            return {"error": "OpenAI API key not configured"}
        
        prompt = f"""
        Extract comprehensive syllabus information in JSON format. Focus on identifying lecture schedules, assignments, exams, and course details.

        Return a JSON object with the following structure:
        {{
            "course_name": "string",
            "instructor": "string",
            "lectures": [
                {{
                    "day": "integer (0=monday, 1=tuesday, 2=wednesday, 3=thursday, 4=friday, 5=saturday, 6=sunday)",
                    "start_time": "HH:MM format (24-hour)",
                    "end_time": "HH:MM format (24-hour)",
                    "start_date": "YYYY-MM-DD format",
                    "end_date": "YYYY-MM-DD format",
                    "location": "string",
                    "type": "one of: 'lecture', 'lab', 'discussion'"
                }}
            ],
            "assignments": [
                {{
                    "description": "string",
                    "parsed_date": "YYYY-MM-DD format",
                    "type": "assignment",
                    "confidence": "integer (0-100)"
                }}
            ],
            "exams": [
                {{
                    "description": "string",
                    "parsed_date": "YYYY-MM-DD format",
                    "type": "exam",
                    "confidence": "integer (0-100)"
                }}
            ]
        }}

        Lecture Type Guidelines:
        - Use 'lecture' for: regular class sessions, main course meetings, instructor presentations, lectures
        - Use 'lab' for: laboratory sessions and computer labs
        - Use 'discussion' for: discussion sections and recitations

        Examples:
        - "Class meets MWF 9:00-10:30" → type: "lecture"
        - "Lab sessions Tuesdays 2:00-5:00" → type: "lab"  
        - "Discussion sections Thursdays 3:00-4:00" → type: "discussion"
        - "Recitation Fridays 1:00-2:00" → type: "discussion"
        - "Studio time Wednesdays 6:00-9:00" → type: "lab"

        Important notes:
        - For lectures: day must be 0-6 (0=Monday, 1=Tuesday, etc.)
        - Times should be in 24-hour format (HH:MM)
        - Dates should be in YYYY-MM-DD format
        - If a lecture type is not specified, default to 'lecture'
        - For assignments and exams, set confidence to 85 if you're confident, 70 if somewhat confident, 50 if uncertain

        Syllabus text to parse:
        {text}

        Return only valid JSON:
        """
        
        return await self._call_gpt(prompt)
    
    async def _call_gpt(self, prompt: str) -> dict:
        """Call OpenAI GPT API"""
        try:
            client = OpenAI(api_key=self.openai_key)
            
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=MAX_TOKENS,
                temperature=0.1  # Lower temperature for more consistent parsing
            )
            
            result = response.choices[0].message.content
            
            # Try to extract JSON if the response contains extra text
            try:
                # Look for JSON content between curly braces
                start = result.find('{')
                end = result.rfind('}') + 1
                if start != -1 and end != 0:
                    json_str = result[start:end]
                    return json.loads(json_str)
                else:
                    return {"error": "No valid JSON found in response"}
            except json.JSONDecodeError as e:
                return {"error": f"Invalid JSON response: {str(e)}"}
            
        except Exception as e:
            return {"error": f"GPT error: {str(e)}"}
    
    def _validate_parsed_data(self, data: dict) -> dict:
        """Validate and clean parsed data"""
        if not isinstance(data, dict):
            return {"error": "Parsed data is not a dictionary"}
        
        # Ensure required fields exist
        validated = {
            "course_name": data.get("course_name", ""),
            "instructor": data.get("instructor", ""),
            "lectures": [],
            "assignments": [],
            "exams": []
        }
        
        # Validate lectures
        if data.get("lectures"):
            for lecture in data["lectures"]:
                if isinstance(lecture, dict):
                    validated_lecture = {
                        "day": self._validate_day(lecture.get("day")),
                        "start_time": lecture.get("start_time", "09:00"),
                        "end_time": lecture.get("end_time", "10:30"),
                        "start_date": lecture.get("start_date", "2024-01-15"),
                        "end_date": lecture.get("end_date", "2024-05-15"),
                        "location": lecture.get("location", ""),
                        "type": self._validate_lecture_type(lecture.get("type"))
                    }
                    validated["lectures"].append(validated_lecture)
        
        # Validate assignments
        if data.get("assignments"):
            for assignment in data["assignments"]:
                if isinstance(assignment, dict):
                    validated_assignment = {
                        "description": assignment.get("description", ""),
                        "parsed_date": assignment.get("parsed_date", "2024-01-15"),
                        "type": "assignment",
                        "confidence": min(max(assignment.get("confidence", 70), 0), 100)
                    }
                    validated["assignments"].append(validated_assignment)
        
        # Validate exams
        if data.get("exams"):
            for exam in data["exams"]:
                if isinstance(exam, dict):
                    validated_exam = {
                        "description": exam.get("description", ""),
                        "parsed_date": exam.get("parsed_date", "2024-01-15"),
                        "type": "exam",
                        "confidence": min(max(exam.get("confidence", 70), 0), 100)
                    }
                    validated["exams"].append(validated_exam)
        
        return validated
    
    def _validate_day(self, day) -> int:
        """Validate and convert day to integer"""
        if isinstance(day, int) and 0 <= day <= 6:
            return day
        
        if isinstance(day, str):
            day_map = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, 
                      "friday": 4, "saturday": 5, "sunday": 6}
            return day_map.get(day.lower(), 0)
        
        return 0  # Default to Monday
    
    def _validate_lecture_type(self, lecture_type: str) -> str:
        """Validate lecture type"""
        valid_types = ["lecture", "lab", "discussion"]
        if lecture_type and lecture_type.lower() in valid_types:
            return lecture_type.lower()
        return "lecture"  # Default to lecture
