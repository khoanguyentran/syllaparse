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
            
            result = await self._gpt_parse(text)
            
            return {
                "success": True,
                "text": text[:500] + "..." if len(text) > 500 else text,
                "parsed": result
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
          Extract key syllabus information in JSON format:

          {{
              "course_name": "string",
              "instructor": "string", 
              "assignments": [
                  {{
                      "name": "string",
                      "due_date": "string",
                      "weight": "string"
                  }}
              ]
          }}

          Text: {text[:2000]}

          Return only JSON:
        """
        
        return await self._call_gpt(prompt)
    
    async def _call_gpt(self, prompt: str) -> dict:
        """Call OpenAI GPT API"""
        try:
            client = OpenAI(api_key=self.openai_key)
            
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=MAX_TOKENS
            )
            
            result = response.choices[0].message.content
            return json.loads(result)
            
        except Exception as e:
            return {"error": f"GPT error: {str(e)}"}
