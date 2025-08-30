#!/usr/bin/env python3
"""
Script to create new database tables with UUID support.
Run this after updating the models to create the new table structure.
"""

import os
import sys
from sqlalchemy import create_engine, text

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.db import get_engine
from app.database.models import Base, User, File, Assignment, Exam, Summary, Lectures

def create_new_tables():
    """Create new tables with UUID support."""
    
    try:
        # Get engine
        engine = get_engine()
        
        print("🔨 Creating new tables with UUID support...")
        
        # Enable UUID extension first
        with engine.connect() as conn:
            with conn.begin():
                print("  Enabling UUID extension...")
                conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        
        # Create all tables (will only create missing ones due to checkfirst=True)
        print("  Creating tables...")
        Base.metadata.create_all(engine, checkfirst=True)
        
        print("✅ All tables created successfully with UUID support!")
        print("\nTables created:")
        print("  • users (integer primary key)")
        print("  • files (UUID primary key)")
        print("  • summaries (references files via UUID)")
        print("  • assignments (references files via UUID)")
        print("  • exams (references files via UUID)")
        print("  • lectures (references files via UUID)")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    print("🚀 Database Table Creation Script")
    print("=" * 50)
    create_new_tables()
