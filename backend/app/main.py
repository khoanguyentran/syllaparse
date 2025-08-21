from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database.db import get_db, get_engine
from app.database.models import Base
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Syllaparse API",
    description="AI-powered syllabus parsing and management API",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://syllaparse-frontend.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Create database tables on startup if database is available"""
    try:
        # Try to create database tables
        logger.info("Starting database initialization...")
        engine = get_engine()
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.warning(f"Could not create database tables: {e}")
        logger.info("This is normal if database is not set up yet")

@app.get("/")
async def root():
    return {"message": "Welcome to Syllaparse API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/hello")
async def hello():
    return {"message": "Hello from the API!"}

@app.get("/api/db-test")
async def test_database(db: Session = Depends(get_db)):
    try:
        logger.info("Testing database connection...")
        # Simple database test
        result = db.execute("SELECT 1").scalar()
        logger.info(f"Database test successful: {result}")
        return {"database": "connected", "test_query": result}
    except Exception as e:
        logger.error(f"Database test failed: {e}")
        return {"database": "error", "message": str(e)}

@app.get("/api/debug-env")
async def debug_environment():
    """Debug endpoint to check environment variables"""
    import os
    database_url = os.getenv("DATABASE_URL")
    return {
        "DATABASE_URL_set": bool(database_url),
        "DATABASE_URL_length": len(database_url) if database_url else 0,
        "DATABASE_URL_preview": database_url[:20] + "..." if database_url and len(database_url) > 20 else database_url
    }
