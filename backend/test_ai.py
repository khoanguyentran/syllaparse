#!/usr/bin/env python3
"""
Simple test script for AI components
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

async def test_ai_components():
    """Test the AI components"""
    try:
        print("Testing AI components...")
        
        # Test configuration
        from app.ai.config import ai_config
        print(f"✓ AI Config loaded: {ai_config.openai_model}")
        
        # Test LLM client initialization
        from app.ai.llm_client import LLMClient
        llm_client = LLMClient()
        print(f"✓ LLM Client initialized: {llm_client.is_available()}")
        
        # Test document processor
        from app.ai.document_processor import DocumentProcessor
        doc_processor = DocumentProcessor()
        print(f"✓ Document Processor initialized: {doc_processor.supported_formats}")
        
        # Test syllabus parser
        from app.ai.syllabus_parser import SyllabusParser
        parser = SyllabusParser()
        print("✓ Syllabus Parser initialized")
        
        print("\nAll AI components initialized successfully!")
        print("\nAvailable endpoints:")
        print("- POST /ai/parse-syllabus")
        print("- POST /ai/extract-assignments") 
        print("- POST /ai/extract-course-info")
        print("- GET /ai/health")
        
    except Exception as e:
        print(f"❌ Error testing AI components: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_ai_components())
