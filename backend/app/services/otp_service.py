from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.otp import OTPRepository
from app.repositories.user import UserRepository
from app.services.email_service import EmailService
from app.models.otp import OTP
from app.utils.errors import *
from app.utils.logger import log


class OTPService:
    """Service for handling OTP operations"""
    
    @staticmethod
    async def request_otp(db: AsyncSession, email: str, purpose: str) -> Dict[str, Any]:
        """Request OTP for registration or login"""
        # Validate purpose
        if purpose not in ["registration", "login"]:
            raise ValueError("Invalid purpose. Must be 'registration' or 'login'")
        
        # For registration, check if user doesn't exist
        if purpose == "registration":
            existing_user = await UserRepository.get_by_email(db=db, email=email)
            if existing_user:
                raise ValueError("Email already registered. Use login instead.")
        
        # For login, check if user exists
        elif purpose == "login":
            existing_user = await UserRepository.get_by_email(db=db, email=email)
            if not existing_user:
                raise ValueError("Email not registered. Please register first.")
        
        # Invalidate any existing unused OTPs for this email and purpose
        await OTPRepository.invalidate_old_otps(db, email, purpose)
        
        # Generate new OTP
        otp_code = OTPRepository.generate_otp()
        
        # Create OTP record
        otp_data = {
            "email": email,
            "otp_code": otp_code,
            "purpose": purpose,
            "expires_at": OTP.create_expiry_time(10)  # 10 minutes
        }
        
        await OTPRepository.create(db, otp_data)
        
        # Send OTP email
        await EmailService.send_otp_email(email, otp_code, purpose)

        log("OTP delivery successful", f"{email} for {purpose}")

        return {
            "email": email, 
            "purpose": purpose, 
            "expires_in_minutes": 10
        }
    
    @staticmethod
    async def verify_otp(db: AsyncSession, email: str, otp_code: str, purpose: str) -> bool:
        """Verify OTP and mark as used if valid"""
        # Find valid OTP
        otp_record = await OTPRepository.get_valid_otp(db, email, otp_code, purpose)
        
        if not otp_record:
            return False
        
        # Mark OTP as used
        await OTPRepository.mark_otp_as_used(db, otp_record.id)

        log("OTP verification successful", f"{email} - {purpose}")
        return True
    
    @staticmethod
    async def cleanup_expired_otps(db: AsyncSession) -> int:
        """Clean up expired OTPs"""
        count = await OTPRepository.cleanup_expired_otps(db)
        if count > 0:
            log("Expired OTP cleanup successful", count)
        return count