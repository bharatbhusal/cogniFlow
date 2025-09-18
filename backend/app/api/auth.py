from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from app.middlewares.auth_middleware import get_current_user
from app.middlewares.otp_middleware import verify_registration_otp, verify_login_otp
from app.services.auth_service import AuthService
from app.types.user import (
    AuthJWTTokenDict,
    OTPRequest,
)
from app.config.db import get_db
from app.utils.responses import create_success_response, create_error_response
from app.utils.logger import log

router = APIRouter()


@router.post("/request-otp")
async def request_otp(otp_request: OTPRequest, db: AsyncSession = Depends(get_db)):
    """Request OTP for registration or login"""
    try:
        result = await AuthService.request_otp(
            db=db, 
            email=otp_request.email, 
            purpose=otp_request.purpose
        )
        
        return create_success_response(
            message=f"OTP sent successfully to {otp_request.email}",
            data=result,
            status_code=status.HTTP_200_OK,
        )
        
    except ValueError as e:
        return create_error_response(
            message=str(e),
            error_code="VALIDATION_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        log("Failed to send OTP",e)
        return create_error_response(
            message="Failed to send OTP",
            error_code="OTP_SEND_FAILED",
            details=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post("/register")
async def register(
    verified_data: Dict[str, Any] = Depends(verify_registration_otp),
    db: AsyncSession = Depends(get_db)
):
    """Complete registration after OTP verification"""
    try:
        result = await AuthService.register_user(
            db=db,
            email=verified_data["email"],
            password=verified_data["password"]
        )
        
        return create_success_response(
            message="User registered successfully",
            data=result,
            status_code=status.HTTP_201_CREATED,
        )
        
    except ValueError as e:
        return create_error_response(
            message=str(e),
            error_code="REGISTRATION_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        log("Registration failed", e)
        return create_error_response(
            message="Registration failed",
            error_code="REGISTRATION_FAILED",
            details=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post("/login")
async def login(
    verified_data: Dict[str, Any] = Depends(verify_login_otp),
    db: AsyncSession = Depends(get_db)
):
    """Complete login after OTP verification"""
    try:
        result = await AuthService.login_user(
            db=db,
            email=verified_data["email"],
            password=verified_data["password"]
        )
        
        return create_success_response(
            message="Login successful",
            data=result,
            status_code=status.HTTP_200_OK,
        )
        
    except ValueError as e:
        return create_error_response(
            message=str(e),
            error_code="LOGIN_ERROR", 
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        log("Login failed", e)
        return create_error_response(
            message="Login failed",
            error_code="LOGIN_FAILED",
            details=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/me")
async def get_me(user: AuthJWTTokenDict = Depends(get_current_user)):
    """Get current user information"""
    try:
        result = await AuthService.get_current_user_profile(user)
        
        return create_success_response(
            message="User fetched successfully",
            data=result,
            status_code=status.HTTP_200_OK,
        )
        
    except Exception as e:
        log("Failed to get user profile:", e)
        return create_error_response(
            message="Failed to get user profile",
            error_code="PROFILE_FETCH_FAILED",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
