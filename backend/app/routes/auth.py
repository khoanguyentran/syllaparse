from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import User
from pydantic import BaseModel
import logging
from datetime import datetime, timezone

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/auth", tags=["authentication"])

# This model mimics the frontend's GoogleUser type
class GoogleUserInfo(BaseModel):
    google_id: str
    email: str
    name: str
    picture: str = None

@router.post("/google/login")
async def google_login(
    user_info: GoogleUserInfo,
    db: Session = Depends(get_db)
):
    """
    Handle Google OAuth login - get existing user or create new one
    """
    try:
        # Check if user exists by Google ID
        existing_user = db.query(User).filter(User.google_id == user_info.google_id).first()
        
        if existing_user:
            # User exists, update their information
            existing_user.name = user_info.name
            existing_user.email = user_info.email
            existing_user.updated_at = datetime.now(timezone.utc)
            
            db.commit()
            db.refresh(existing_user)
            
            logger.info(f"Google user logged in: {existing_user.email}")
            
            return {
                "message": "Login successful",
                "user": existing_user,
                "is_new_user": False
            }
        
        # Create new Google user (simple flow)
        new_user = User(
            google_id=user_info.google_id,
            email=user_info.email,
            name=user_info.name,
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"New Google user created: {new_user.email}")
        
        return {
            "message": "Account created successfully",
            "user": new_user,
            "is_new_user": True
        }
        
    except Exception as e:
        logger.error(f"Error in Google login: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")