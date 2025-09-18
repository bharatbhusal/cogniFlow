from typing import Callable, Dict, Any
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.db import get_db
from app.services.otp_service import OTPService
from app.utils.logger import log


class OTPVerificationMiddleware:
    """Middleware to verify OTP before processing registration/login"""
    
    @staticmethod
    async def verify_otp_for_registration(
        request: Request,
        db: AsyncSession = Depends(get_db)
    ) -> Dict[str, Any]:
        """Middleware to verify OTP for registration"""
        return await OTPVerificationMiddleware._verify_otp(request, db, "registration")
    
    @staticmethod
    async def verify_otp_for_login(
        request: Request, 
        db: AsyncSession = Depends(get_db)
    ) -> Dict[str, Any]:
        """Middleware to verify OTP for login"""
        return await OTPVerificationMiddleware._verify_otp(request, db, "login")
    
    @staticmethod
    async def _verify_otp(
        request: Request,
        db: AsyncSession,
        purpose: str
    ) -> Dict[str, Any]:
        """Internal method to verify OTP"""
        try:
            # Get request body
            body = await request.json()
            
            email = body.get("email")
            otp_code = body.get("otp_code")
            
            if not email or not otp_code:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email and OTP code are required"
                )
            
            # Verify OTP
            is_valid = await OTPService.verify_otp(db, email, otp_code, purpose)
            
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired OTP. Please request a new one."
                )
            
            log("OTP verification successful", f"{email} - {purpose}")
            
            # Return validated data for use in the endpoint
            return {
                "email": email,
                "password": body.get("password"),
                "verified": True
            }
            
        except HTTPException:
            raise
        except Exception as e:
            log("OTP verification failed", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OTP verification failed"
            )


# Dependency functions for easier use in FastAPI endpoints
async def verify_registration_otp(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Dependency to verify OTP for registration"""
    return await OTPVerificationMiddleware.verify_otp_for_registration(request, db)


async def verify_login_otp(
    request: Request,
    db: AsyncSession = Depends(get_db) 
) -> Dict[str, Any]:
    """Dependency to verify OTP for login"""
    return await OTPVerificationMiddleware.verify_otp_for_login(request, db)