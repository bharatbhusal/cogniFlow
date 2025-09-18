from sqlalchemy import Column, String, DateTime, Boolean, func, ForeignKey
from sqlalchemy.orm import relationship
from app.config.db import Base
from app.utils.cuid_str import cuid_str
from datetime import datetime, timedelta, timezone


class OTP(Base):
    __tablename__ = "otps"

    id = Column(String, primary_key=True, default=cuid_str)
    email = Column(String, nullable=False, index=True)
    otp_code = Column(String, nullable=False)
    purpose = Column(String, nullable=False)  # 'registration' or 'login'
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<OTP(id='{self.id}', email='{self.email}', purpose='{self.purpose}')>"

    def is_expired(self) -> bool:
        """Check if OTP has expired"""
        return datetime.now(timezone.utc) > self.expires_at

    def is_valid(self) -> bool:
        """Check if OTP is valid (not used and not expired)"""
        return not self.is_used and not self.is_expired()

    @classmethod
    def create_expiry_time(cls, minutes: int = 10) -> datetime:
        """Create expiry time for OTP (default 10 minutes)"""
        return datetime.now(timezone.utc) + timedelta(minutes=minutes)