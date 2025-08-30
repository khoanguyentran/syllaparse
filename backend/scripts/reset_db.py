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
from app.database.models import User, File, Summary, Assignment, Exam, Lectures

def recreate_tables():
    """Drop all tables and recreate them with the current schema"""
    print("🗑️  Dropping all existing tables...")
    
    # Get the engine
    engine = get_engine()
    
    try:
        with engine.begin() as conn:
            # Drop tables in the correct order to avoid foreign key constraint issues
            # First drop tables that depend on others
            print("  Dropping dependent tables...")
            
            # Check if old assignments_exams table exists and drop it first
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'assignments_exams'
                );
            """))
            
            if result.scalar():
                print("  Dropping old assignments_exams table...")
                conn.execute(text("DROP TABLE IF EXISTS assignments_exams CASCADE;"))
            
            # Drop other dependent tables
            conn.execute(text("DROP TABLE IF EXISTS lectures CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS summaries CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS assignments CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS exams CASCADE;"))
            
            # Finally drop the core tables
            print("  Dropping core tables...")
            conn.execute(text("DROP TABLE IF EXISTS files CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
            
            # Drop any remaining tables
            print("  Dropping any remaining tables...")
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            
            # Enable UUID extension for PostgreSQL
            print("  Enabling UUID extension...")
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
            
        print("✅ All tables dropped successfully")
        
        print("🔨 Creating new tables with updated schema...")
        
        # Create all tables
        Base.metadata.create_all(engine)
        print("✅ All tables created successfully with UUID support")
        
        print("🎉 Database schema has been updated!")
        print("\nKey changes:")
        print("  • File IDs are now UUIDs instead of integers")
        print("  • All foreign keys updated to reference UUIDs")
        print("  • UUID extension enabled for PostgreSQL")
        print("\nNote: All existing data has been lost. This is expected during development.")
        
    except Exception as e:
        print(f"❌ Error during table recreation: {e}")
        print("Trying alternative approach...")
        
        # Fallback: Use SQLAlchemy's drop_all with checkfirst=False
        try:
            Base.metadata.drop_all(engine, checkfirst=False)
            print("✅ All tables dropped successfully (fallback method)")
            
            Base.metadata.create_all(engine)
            print("✅ All tables created successfully")
            print("🎉 Database schema has been updated!")
            
        except Exception as e2:
            print(f"❌ Fallback method also failed: {e2}")
            print("You may need to manually drop tables or use psql to reset the database.")
            raise

if __name__ == "__main__":
    print("🚀 Database Table Recreation Script")
    print("=" * 50)
    
    # Confirm before proceeding
    response = input("⚠️  This will DELETE ALL DATA in your database. Are you sure? (yes/no): ")
    
    if response.lower() == "yes":
        recreate_tables()
    else:
        print("❌ Operation cancelled.")
