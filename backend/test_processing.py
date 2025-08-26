#!/usr/bin/env python3
"""
Test script for the processing module
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

async def test_processing():
    """Test the processing components"""
    try:
        print("Testing processing module...")
        
        # Test configuration
        from app.processing.config import OPENAI_API_KEY, DEFAULT_MODEL
        print(f"✓ Config loaded: {DEFAULT_MODEL}")
        print(f"✓ OpenAI key available: {bool(OPENAI_API_KEY)}")
        
        # Test parser
        from app.processing.parser import Parser
        parser = Parser()
        print("✓ Parser initialized")
        
        # Test routes
        from app.processing.routes import router
        print("✓ Routes loaded")
        
        print("\nAll processing components initialized successfully!")
        print("\nAvailable endpoints:")
        print("- POST /processing/parse/{file_id}")
        print("- GET /processing/health")
        
        # Test health check
        if OPENAI_API_KEY:
            print("\n✓ Ready to process syllabi with GPT")
        else:
            print("\n⚠ OpenAI API key not configured")
            print("Set OPENAI_API_KEY environment variable to test parsing")
        
    except Exception as e:
        print(f"❌ Error testing processing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_processing())
