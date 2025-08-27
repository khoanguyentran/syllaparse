#!/usr/bin/env python3
"""
Script to drop and recreate all database tables
Use this when you've made schema changes during development
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database.db import Base, get_engine
from app.database.models import User, File, Summary, AssignmentExam, Lectures

def recreate_tables():
    """Drop all tables and recreate them with the current schema"""
    print("🗑️  Dropping all existing tables...")
    
    # Get the engine
    engine = get_engine()
    
    # Drop all tables
    Base.metadata.drop_all(engine)
    print("✅ All tables dropped successfully")
    
    print("🔨 Creating new tables with updated schema...")
    
    # Create all tables
    Base.metadata.create_all(engine)
    print("✅ All tables created successfully")
    
    print("🎉 Database schema has been updated!")
    print("\nNote: All existing data has been lost. This is expected during development.")

if __name__ == "__main__":
    print("🚀 Database Table Recreation Script")
    print("=" * 50)
    
    # Confirm before proceeding
    response = input("⚠️  This will DELETE ALL DATA in your database. Are you sure? (yes/no): ")
    
    if response.lower() == 'yes':
        recreate_tables()
    else:
        print("❌ Operation cancelled.")
