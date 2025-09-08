from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.types.user import UserRegister

class UserRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, user: Dict) -> User:
        db_user = User(**user) 
        db.add(db_user)        
        await db.commit()
        await db.refresh(db_user)
        return db_user 
