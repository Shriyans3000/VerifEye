import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from backend.database import (
    authenticate_officer,
    register_officer,
    list_registered_officers,
)

logger = logging.getLogger("verifeye.auth")
router = APIRouter(tags=["Authentication"])


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "Officer"
    badge_id: Optional[str] = None
    jurisdiction: Optional[str] = None


@router.post("/auth/login")
@router.post("/login")
def login(payload: LoginRequest):
    try:
        user = authenticate_officer(payload.email, payload.password)
        return {
            "success": True,
            "message": "Official officer authentication successful.",
            "user": user,
        }
    except ValueError as e:
        msg = str(e)
        if "not registered" in msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=msg,
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=msg,
        )
    except Exception as e:
        logger.error(f"Error during officer authentication: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during authentication.",
        )


@router.post("/auth/register")
@router.post("/register")
def register(payload: RegisterRequest):
    try:
        data = payload.dict()
        user = register_officer(data)
        return {
            "success": True,
            "message": "Officer account registered successfully in the database.",
            "user": user,
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error during officer registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration.",
        )


@router.get("/auth/officers")
@router.get("/officers")
def get_officers():
    try:
        officers = list_registered_officers()
        return {
            "success": True,
            "officers": officers,
            "count": len(officers),
        }
    except Exception as e:
        logger.error(f"Error fetching registered officers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not fetch registered officers.",
        )
