from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.models.message import Message
from app.types.message import MessageCreate, MessageUpdate

class MessageRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, message_id: str) -> Message | None:
        result = await db.execute(select(Message).options(selectinload(Message.project)).where(Message.id == message_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_project_id(db: AsyncSession, project_id: str) -> List[Message]:
        result = await db.execute(
            select(Message)
            .options(selectinload(Message.project))
            .where(Message.project_id == project_id)
            .order_by(Message.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, message: MessageCreate) -> Message:
        db_message = Message(**message.model_dump())
        db.add(db_message)
        await db.commit()
        await db.refresh(db_message)
        return db_message

    @staticmethod
    async def update(db: AsyncSession, message_id: str, message_data: MessageUpdate) -> Message | None:
        result = await db.execute(select(Message).where(Message.id == message_id))
        db_message = result.scalar_one_or_none()
        
        if db_message:
            for key, value in message_data.model_dump().items():
                setattr(db_message, key, value)
            await db.commit()
            await db.refresh(db_message)
        
        return db_message

    @staticmethod
    async def delete(db: AsyncSession, message_id: str) -> bool:
        result = await db.execute(select(Message).where(Message.id == message_id))
        db_message = result.scalar_one_or_none()
        
        if db_message:
            await db.delete(db_message)
            await db.commit()
            return True
        
        return False
