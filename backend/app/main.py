from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, engine
from models import Base
import os

# Create database tables
Base.metadata.create_all(bind=engine)

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
        # Simple database test
        result = db.execute("SELECT 1").scalar()
        return {"database": "connected", "test_query": result}
    except Exception as e:
        return {"database": "error", "message": str(e)}
