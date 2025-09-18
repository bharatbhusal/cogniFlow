from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, delete
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from app.models.otp import OTP
import random
import string


class OTPRepository:
    """Repository for OTP operations"""
    
    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generate random OTP code"""
        return ''.join(random.choices(string.digits, k=length))
    
    @staticmethod
    async def create(db: AsyncSession, otp_data: Dict[str, Any]) -> OTP:
        """Create a new OTP record"""
        otp = OTP(**otp_data)
        db.add(otp)
        await db.commit()
        await db.refresh(otp)
        return otp
    
    @staticmethod
    async def get_valid_otp(db: AsyncSession, email: str, otp_code: str, purpose: str) -> Optional[OTP]:
        """Get valid (unused and not expired) OTP for verification"""
        result = await db.execute(
            select(OTP).where(
                and_(
                    OTP.email == email,
                    OTP.otp_code == otp_code,
                    OTP.purpose == purpose,
                    OTP.is_used == False,
                    OTP.expires_at > datetime.now(timezone.utc)
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def mark_otp_as_used(db: AsyncSession, otp_id: str) -> Optional[OTP]:
        """Mark OTP as used"""
        result = await db.execute(select(OTP).where(OTP.id == otp_id))
        otp = result.scalar_one_or_none()
        
        if otp:
            otp.is_used = True
            otp.updated_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(otp)
            
        return otp
    
    @staticmethod
    async def cleanup_expired_otps(db: AsyncSession) -> int:
        """Remove expired OTPs from database"""
        result = await db.execute(
            delete(OTP).where(OTP.expires_at < datetime.now(timezone.utc))
        )
        await db.commit()
        return result.rowcount
    
    @staticmethod
    async def get_latest_otp_for_email(db: AsyncSession, email: str, purpose: str) -> Optional[OTP]:
        """Get the latest OTP for an email and purpose"""
        result = await db.execute(
            select(OTP)
            .where(and_(OTP.email == email, OTP.purpose == purpose))
            .order_by(OTP.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def invalidate_old_otps(db: AsyncSession, email: str, purpose: str) -> int:
        """Mark all existing OTPs as used for the email and purpose"""
        result = await db.execute(
            select(OTP).where(
                and_(
                    OTP.email == email, 
                    OTP.purpose == purpose,
                    OTP.is_used == False
                )
            )
        )
        otps = result.scalars().all()
        
        count = 0
        for otp in otps:
            otp.is_used = True
            otp.updated_at = datetime.now(timezone.utc)
            count += 1
            
        if count > 0:
            await db.commit()
            
        return count