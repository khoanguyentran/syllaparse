from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.db import get_db
from app.database.models import File as FileModel, User
from app.processing.routes import _start_parsing
from pydantic import BaseModel
import logging
import uuid

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/files", tags=["files"])

# Pydantic models for request/response
class FileUploadRequest(BaseModel):
    google_id: str  
    filename: str
    filepath: str  
    file_size: int
    content_type: str

class FileUploadResponse(BaseModel):
    message: str
    file_id: str  # UUID as string
    filename: str
    filepath: str  
    upload_date: str

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file_data: FileUploadRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Store file metadata in database and trigger parsing (file already uploaded to GCS by Next.js frontend)
    """
    try:
        # Find user by Google ID
        user = db.query(User).filter(User.google_id == file_data.google_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Save file metadata to database using backend user ID
        db_file = FileModel(
            user_id=user.id,  # Use backend user ID for database relationship
            filename=file_data.filename,
            file_path=file_data.filepath  # Store complete GCS public URL
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        # Trigger parsing in the background
        try:
            await _start_parsing(str(db_file.id), background_tasks, db)
            logger.info(f"Parsing triggered for file {db_file.id}")
        except Exception as parse_error:
            logger.warning(f"Failed to trigger parsing for file {db_file.id}: {parse_error}")
            # Don't fail the upload if parsing fails to start
        
        return FileUploadResponse(
            message="File metadata stored successfully and parsing initiated",
            file_id=str(db_file.id), 
            filename=db_file.filename,
            filepath=db_file.file_path, 
            upload_date=db_file.upload_date.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error storing file metadata: {e}")
        raise HTTPException(status_code=500, detail="Failed to store file metadata")

@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete file metadata from database
    Note: Actual file deletion from GCS should be handled by Next.js frontend
    """
    try:
        # Validate UUID format
        try:
            file_uuid = uuid.UUID(file_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid file ID format")
        
        # Get file from database
        db_file = db.query(FileModel).filter(FileModel.id == file_uuid).first()
        if not db_file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Delete from database
        db.delete(db_file)
        db.commit()
        
        logger.info(f"File metadata deleted successfully: {file_id}")
        return {"message": "File metadata deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file metadata: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file metadata")

@router.get("/{file_id}")
async def get_file(
    file_id: str,
    db: Session = Depends(get_db)
):
    """
    Get file information from database
    """
    try:
        # Validate UUID format
        try:
            file_uuid = uuid.UUID(file_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid file ID format")
        
        # Get file from database
        db_file = db.query(FileModel).filter(FileModel.id == file_uuid).first()
        if not db_file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Use stored public URL directly
        return {
            "file_id": str(db_file.id), 
            "filename": db_file.filename,
            "upload_date": db_file.upload_date.isoformat(),
            "filepath": db_file.file_path,  # Complete GCS public URL
            "user_id": db_file.user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file: {e}")
        raise HTTPException(status_code=500, detail="Failed to get file")

@router.get("/")
async def list_user_files(
    user_id: int = None,
    google_id: str = None,
    db: Session = Depends(get_db)
):
    """
    List all files for a specific user (by user_id or google_id)
    """
    try:
        if not user_id and not google_id:
            raise HTTPException(status_code=400, detail="Either user_id or google_id must be provided")
        
        if google_id:
            # Find user by Google ID
            user = db.query(User).filter(User.google_id == google_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            user_id = user.id
        else:
            # Check if user exists by user_id
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's files from database
        db_files = db.query(FileModel).filter(FileModel.user_id == user_id).all()
        
        files = []
        for db_file in db_files:
            files.append({
                "file_id": str(db_file.id), 
                "filename": db_file.filename,
                "upload_date": db_file.upload_date.isoformat(),
                "filepath": db_file.file_path,  # Complete GCS public URL
                "user_id": db_file.user_id
            })
        
        logger.info(f"Retrieved {len(files)} files for user {user_id}")
        return {"files": files, "total": len(files)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise HTTPException(status_code=500, detail="Failed to list files")

@router.get("/health/storage")
async def file_storage_health_check():
    """
    Check if file storage system is working
    """
    try:
        return {
            "status": "healthy",
            "message": "File storage system is working",
            "backend": "Python FastAPI",
            "note": "Files are stored in Google Cloud Storage via Next.js frontend"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"File storage error: {str(e)}",
            "backend": "Python FastAPI"
        }

@router.get("/test/db")
async def test_database_connection(db: Session = Depends(get_db)):
    """
    Test database connection and basic operations
    """
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        
        # Test user table
        user_count = db.query(User).count()
        
        # Test file table
        file_count = db.query(FileModel).count()
        
        return {
            "status": "healthy",
            "message": "Database connection successful",
            "user_count": user_count,
            "file_count": file_count
        }
    except Exception as e:
        logger.error(f"Database test failed: {e}")
        return {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
