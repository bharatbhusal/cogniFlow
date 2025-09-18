from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user import UserRepository
from app.services.otp_service import OTPService
from app.services.email_service import EmailService
from app.types.user import UserRegisterDict
from app.utils.hashing import hash_data, verify_data
from app.utils.jwt import create_access_token
from app.utils.logger import log


class AuthService:
    """Service for handling authentication operations"""
    
    @staticmethod
    async def request_otp(db: AsyncSession, email: str, purpose: str) -> Dict[str, Any]:
        """Request OTP for registration or login - delegates to OTP service"""
        return await OTPService.request_otp(db, email, purpose)
    
    @staticmethod
    async def register_user(db: AsyncSession, email: str, password: str) -> Dict[str, Any]:
        """Register a new user (OTP should already be verified via middleware)"""
        try:
            # Double-check if user already exists
            existing_user = await UserRepository.get_by_email(db=db, email=email)
            if existing_user:
                raise ValueError("Email already registered")
            
            # Hash password and create user
            user_dict: UserRegisterDict = {
                "email": email,
                "password": hash_data(password),
            }
            
            new_user = await UserRepository.create(db=db, user=user_dict)
            
            # Send welcome email
            await EmailService.send_welcome_email(email)

            log("User registeration successful", email)

            return {
                "user": {
                    "id": new_user.id, 
                    "email": new_user.email, 
                    "full_name": new_user.full_name
                }
            }
            
        except Exception as e:
            log(f"Registration failed for {email}", e)
            raise
    
    @staticmethod
    async def login_user(db: AsyncSession, email: str, password: str) -> Dict[str, Any]:
        """Login user (OTP should already be verified via middleware)"""
        try:
            # Check if user exists
            existing_user = await UserRepository.get_by_email(db=db, email=email)
            if not existing_user:
                raise ValueError("User doesn't exist")
            
            # Verify password
            if not verify_data(password, existing_user.password):
                raise ValueError("Invalid email or password")
            
            # Create JWT token
            token = create_access_token({
                "id": existing_user.id,
                "password": password,
                "email": existing_user.email,
            })

            log("User login successful", email)

            return {
                "access_token": token,
                "user": {
                    "id": existing_user.id, 
                    "email": existing_user.email, 
                    "full_name": existing_user.full_name
                }
            }
            
        except Exception as e:
            log(f"Login failed for {email}", e)
            raise
    
    @staticmethod
    async def get_current_user_profile(user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get current user profile information"""
        return {
            "user": {
                "id": user_data["id"], 
                "email": user_data["email"]
            }
        }