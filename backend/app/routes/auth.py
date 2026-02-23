from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import User
from pydantic import BaseModel
import logging
from datetime import datetime, timezone
import httpx

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

class GoogleTokenRequest(BaseModel):
    access_token: str

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

@router.post("/google/token")
async def store_google_token(
    token_request: GoogleTokenRequest,
    response: Response
):
    """
    Store Google access token in httpOnly cookie
    Token is already validated by Google OAuth, no need to validate again
    """
    try:
        # Set httpOnly, secure, sameSite cookie
        response.set_cookie(
            key="google_access_token",
            value=token_request.access_token,
            httponly=True,
            secure=True,  # Only send over HTTPS
            samesite="lax",  # CSRF protection
            max_age=3600,  # 1 hour expiration
            path="/"
        )
        
        return {"message": "Token stored successfully"}
        
    except Exception as e:
        logger.error(f"Error storing Google token: {e}")
        raise HTTPException(status_code=500, detail="Failed to store token")

@router.post("/google/logout")
async def google_logout(response: Response):
    """
    Clear Google access token cookie
    """
    response.delete_cookie(
        key="google_access_token",
        path="/",
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return {"message": "Logged out successfully"}

@router.get("/google/calendar/check")
async def check_calendar_access(request: Request):
    """
    Check if user has Google Calendar access using token from cookie
    """
    token = request.cookies.get("google_access_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="No access token found")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/calendar/v3/calendars/primary",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            return {"has_access": response.is_success}
    except Exception as e:
        logger.error(f"Error checking calendar access: {e}")
        raise HTTPException(status_code=500, detail="Failed to check calendar access")

@router.post("/google/calendar/events")
async def create_calendar_event(
    event_data: dict,
    request: Request
):
    """
    Create a calendar event in user's Google Calendar
    """
    token = request.cookies.get("google_access_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="No access token found")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                json={
                    "summary": event_data.get("summary"),
                    "description": event_data.get("description"),
                    "start": event_data.get("start"),
                    "end": event_data.get("end"),
                    "location": event_data.get("location"),
                    "reminders": event_data.get("reminders", {
                        "useDefault": False,
                        "overrides": [
                            {"method": "popup", "minutes": 30},
                            {"method": "email", "minutes": 60}
                        ]
                    })
                }
            )
            
            if response.is_success:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to create calendar event: {response.text}"
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating calendar event: {e}")
        raise HTTPException(status_code=500, detail="Failed to create calendar event")