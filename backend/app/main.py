from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database.db import get_db, get_engine
from app.database.models import Base, User, File, Summary, AssignmentExam, Lectures
from app.routes import files, auth, users, summaries, assignments_exams, lectures
from app.ai import routes as ai_routes
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
        "https://syllaparse-frontend.onrender.com/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(files.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(summaries.router)
app.include_router(assignments_exams.router)
app.include_router(lectures.router)
app.include_router(ai_routes.router)

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