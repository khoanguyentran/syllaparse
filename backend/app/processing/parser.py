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
        
        prompt = f"""Extract structured data from this syllabus:

REQUIRED FIELDS:
- course_name: Course title and number
- instructor: Professor name and contact  
- summary: Course description paragraph (topics, objectives, prerequisites)
- lectures: [{{"day": 0-6, "start_time": "HH:MM", "end_time": "HH:MM", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "location": "string", "type": "lecture/lab/discussion"}}]
- assignments: [{{"description": "Assignment name only", "date": "YYYY-MM-DD" or "Not Listed", "time_due": "HH:MM or Not Listed", "confidence": 0-100}}]
- exams: [{{"description": "Exam name", "date": "YYYY-MM-DD" or "Not Listed", "time_due": "HH:MM or Not Listed", "confidence": 0-100}}]
- grading: {{"categories": [{{"name": "string", "weight": float, "description": "string"}}], "confidence": 0-100}}

RULES:
- Days: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
- Times: 24-hour format "HH:MM" or "Not Listed" if not listed
- Dates: "YYYY-MM-DD" format or "Not Listed" if not listed
- Confidence: 85=confident, 70=somewhat confident, 50=uncertain
- Assignment descriptions: Keep brief ("Assignment 1", not full instructions)
- NEVER guess dates/times - return "Not Listed" if you are not sure (confidence <= 70)
- If there aren't specific dates, if the syllabus says Fall then use August 20th as the start date and December 20th as the end date. 
If the syllabus says Spring then use January 20th as the start date and May 15th as the end date.

SYLLABUS:
{text}"""
        
        return await self._run_llm(prompt)
    
    async def _run_llm(self, prompt: str) -> dict:
        """Call OpenAI GPT API with structured output"""
        try:
            client = OpenAI(api_key=self.openai_key)
            
            response = client.beta.chat.completions.parse(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": "You are a university professor with 20+ years of experience creating syllabi. You understand all syllabi terminology and can perfectly understand other professor's syllabi."},
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
