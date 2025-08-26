import logging
from typing import Dict, Any, List
from .document_processor import DocumentProcessor
from .llm_client import LLMClient
from .config import ai_config

logger = logging.getLogger(__name__)

class SyllabusParser:
    """Parses syllabus documents using AI to extract structured information"""
    
    def __init__(self):
        self.doc_processor = DocumentProcessor()
        self.llm_client = LLMClient()
    
    async def parse_syllabus(self, file_url: str, file_type: str) -> Dict[str, Any]:
        """Parse a syllabus document and extract structured information"""
        try:
            # Process the document to extract text
            doc_data = await self.doc_processor.process_document(file_url, file_type)
            
            # Use LLM to extract structured information
            structured_data = await self._extract_structured_data(doc_data["full_text"])
            
            return {
                "document_info": doc_data,
                "parsed_data": structured_data,
                "parsing_method": "ai_llm"
            }
            
        except Exception as e:
            logger.error(f"Error parsing syllabus: {e}")
            raise
    
    async def _extract_structured_data(self, text: str) -> Dict[str, Any]:
        """Use LLM to extract structured syllabus information"""
        try:
            # Create prompt for syllabus parsing
            prompt = self._create_syllabus_prompt(text)
            
            # Get LLM response
            response = await self.llm_client.generate_response(prompt)
            
            # Parse the response (assuming JSON format)
            import json
            try:
                parsed_response = json.loads(response)
                return parsed_response
            except json.JSONDecodeError:
                # If not valid JSON, return as raw text
                return {
                    "raw_response": response,
                    "parsing_error": "LLM response was not valid JSON"
                }
                
        except Exception as e:
            logger.error(f"Error extracting structured data: {e}")
            raise
    
    def _create_syllabus_prompt(self, text: str) -> str:
        """Create a prompt for the LLM to parse syllabus"""
        return f"""
Please analyze the following syllabus text and extract key information in JSON format. 
Return only valid JSON with the following structure:

{{
    "course_info": {{
        "course_name": "string",
        "course_code": "string",
        "instructor": "string",
        "semester": "string",
        "credits": "number"
    }},
    "schedule": {{
        "meeting_times": "string",
        "location": "string",
        "office_hours": "string"
    }},
    "grading": {{
        "grading_scale": "string",
        "assignments": [
            {{
                "name": "string",
                "weight": "string",
                "due_date": "string"
            }}
        ]
    }},
    "policies": {{
        "attendance": "string",
        "late_work": "string",
        "academic_integrity": "string"
    }},
    "materials": {{
        "required_texts": ["string"],
        "recommended_texts": ["string"],
        "other_materials": ["string"]
    }}
}}

Syllabus text:
{text[:3000]}  # Limit text length for token efficiency

Extract the information and return only the JSON response:
"""
    
    async def extract_assignments(self, text: str) -> List[Dict[str, Any]]:
        """Extract assignment information from syllabus text"""
        try:
            prompt = f"""
Extract all assignment information from this syllabus text. Return a JSON array of assignments with this structure:

[
    {{
        "name": "Assignment name",
        "description": "Brief description",
        "due_date": "Due date if mentioned",
        "weight": "Percentage or points if mentioned",
        "type": "Assignment type (exam, project, etc.)"
    }}
]

Syllabus text:
{text[:2000]}

Return only the JSON array:
"""
            
            response = await self.llm_client.generate_response(prompt)
            
            import json
            try:
                assignments = json.loads(response)
                if isinstance(assignments, list):
                    return assignments
                else:
                    return []
            except json.JSONDecodeError:
                return []
                
        except Exception as e:
            logger.error(f"Error extracting assignments: {e}")
            return []
    
    async def extract_course_info(self, text: str) -> Dict[str, Any]:
        """Extract basic course information"""
        try:
            prompt = f"""
Extract basic course information from this syllabus. Return JSON with this structure:

{{
    "course_name": "Full course name",
    "course_code": "Course code/number",
    "instructor": "Instructor name",
    "semester": "Semester/term",
    "credits": "Number of credits"
}}

Syllabus text:
{text[:1500]}

Return only the JSON:
"""
            
            response = await self.llm_client.generate_response(prompt)
            
            import json
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                return {}
                
        except Exception as e:
            logger.error(f"Error extracting course info: {e}")
            return {}
