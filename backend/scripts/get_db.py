#!/usr/bin/env python3
"""
Check database contents and show all data
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Add the parent directory to the Python path so we can import from app
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database.models import User, File, Summary, Assignment, Exam, Lectures

def check_database():
    """Check all database tables and their contents"""
    print("🔍 Checking Database Contents...")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    
    # Get database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL environment variable is not set")
        return
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        # Check each table
        check_users(engine)
        check_files(engine)
        check_summaries(engine)
        check_assignments(engine)
        check_exams(engine)
        check_lectures(engine)
        
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")

def check_users(engine):
    """Check users table"""
    print("\n👤 USERS TABLE:")
    print("-" * 30)
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM users"))
            users = result.fetchall()
            
            if not users:
                print("   No users found")
                return
            
            for user in users:
                print(f"   ID: {user[0]}")
                print(f"   Google ID: {user[1]}")
                print(f"   Email: {user[2]}")
                print(f"   Name: {user[3]}")
                print(f"   Role: {user[4]}")
                print(f"   Created: {user[5]}")
                print(f"   Updated: {user[6]}")
                print("   ---")
                
    except Exception as e:
        print(f"   Error checking users: {e}")

def check_files(engine):
    """Check files table"""
    print("\n📁 FILES TABLE:")
    print("-" * 30)
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM files"))
            files = result.fetchall()
            
            if not files:
                print("   No files found")
                return
            
            for file in files:
                print(f"   ID: {file[0]}")
                print(f"   User ID: {file[1]}")
                print(f"   Filename: {file[2]}")
                print(f"   File Path: {file[3][:50]}..." if len(str(file[3])) > 50 else f"   File Path: {file[3]}")
                print(f"   Upload Date: {file[4]}")
                print("   ---")
                
    except Exception as e:
        print(f"   Error checking files: {e}")

def check_summaries(engine):
    """Check summaries table"""
    print("\n📝 SUMMARIES TABLE:")
    print("-" * 30)
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM summaries"))
            summaries = result.fetchall()
            
            if not summaries:
                print("   No summaries found")
                return
            
            for summary in summaries:
                print(f"   ID: {summary[0]}")
                print(f"   File ID: {summary[1]}")
                print(f"   Summary: {summary[2][:100]}..." if len(str(summary[2])) > 100 else f"   Summary: {summary[2]}")
                print(f"   Confidence: {summary[3]}")
                print(f"   Created: {summary[4]}")
                print(f"   Updated: {summary[5]}")
                print("   ---")
                
    except Exception as e:
        print(f"   Error checking summaries: {e}")

def check_assignments(engine):
    """Check assignments table"""
    print("\n📚 ASSIGNMENTS TABLE:")
    print("-" * 30)
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM assignments"))
            assignments = result.fetchall()
            
            if not assignments:
                print("   No assignments found")
                return
            
            for assignment in assignments:
                print(f"   ID: {assignment[0]}")
                print(f"   File ID: {assignment[1]}")
                print(f"   Due Date: {assignment[2]}")
                print(f"   Confidence: {assignment[3]}")
                print(f"   Created: {assignment[4]}")
                print(f"   Updated: {assignment[5]}")
                print(f"   Description: {assignment[6]}")
                print("   ---")
                
    except Exception as e:
        print(f"   Error checking assignments: {e}")

def check_exams(engine):
    """Check exams table"""
    print("\n🧪 EXAMS TABLE:")
    print("-" * 30)
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM exams"))
            exams = result.fetchall()
            
            if not exams:
                print("   No exams found")
                return
            
            for exam in exams:
                print(f"   ID: {exam[0]}")
                print(f"   File ID: {exam[1]}")
                print(f"   Exam Date: {exam[2]}")
                print(f"   Confidence: {exam[3]}")
                print(f"   Created: {exam[4]}")
                print(f"   Updated: {exam[5]}")
                print(f"   Description: {exam[6]}")
                print("   ---")
                
    except Exception as e:
        print(f"   Error checking exams: {e}")

def check_lectures(engine):
    """Check lectures table"""
    print("\n⏰ LECTURES TABLE:")
    print("-" * 30)
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM lectures"))
            lectures = result.fetchall()
            
            if not lectures:
                print("   No lectures found")
                return
            
            for lecture in lectures:
                print(f"   ID: {lecture[0]}")
                print(f"   File ID: {lecture[1]}")
                print(f"   Day: {lecture[2]}")
                print(f"   Start Time: {lecture[3]}")
                print(f"   End Time: {lecture[4]}")
                print(f"   Start Date: {lecture[5]}")
                print(f"   End Date: {lecture[6]}")
                print(f"   Location: {lecture[7]}")
                print(f"   Created: {lecture[8]}")
                print("   ---")
                
    except Exception as e:
        print(f"   Error checking lectures: {e}")

if __name__ == "__main__":
    check_database()
