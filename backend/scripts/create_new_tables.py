#!/usr/bin/env python3
"""
Simple script to create new assignments and exams tables.
Run this after updating the models to create the new table structure.
"""

import os
import sys
from sqlalchemy import create_engine, text

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.db import get_engine
from app.database.models import Base, Assignment, Exam

def create_new_tables():
    """Create the new assignments and exams tables."""
    
    try:
        # Get engine
        engine = get_engine()
        
        print("Creating new tables...")
        
        # Create tables
        Assignment.__table__.create(engine, checkfirst=True)
        Exam.__table__.create(engine, checkfirst=True)
        
        print("New tables created successfully!")
        
    except Exception as e:
        print(f"Error creating tables: {e}")
        raise

if __name__ == "__main__":
    create_new_tables()
