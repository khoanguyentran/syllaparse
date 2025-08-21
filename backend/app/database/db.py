from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
def get_database_url():
    """Get database URL from environment variable"""
    return os.getenv(
        "DATABASE_URL", 
    )

# Create Base class
Base = declarative_base()

# Lazy initialization of engine and session
_engine = None
_SessionLocal = None

def get_engine():
    """Get or create database engine"""
    global _engine
    if _engine is None:
        database_url = get_database_url()
        _engine = create_engine(database_url)
    return _engine

def get_session_local():
    """Get or create session local"""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal

# Dependency to get database session
def get_db():
    db = get_session_local()()
    try:
        yield db
    finally:
        db.close()
