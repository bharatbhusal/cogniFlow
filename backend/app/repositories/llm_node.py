from sqlalchemy.ext.asyncio import AsyncSession
from app.models.llm_node import LLMNode
from sqlalchemy.future import select

class LLMNodeRepository:
    @staticmethod
    async def create(db: AsyncSession, data: dict):
        node = LLMNode(**data)
        db.add(node)
        await db.commit()
        await db.refresh(node)
        return node

    @staticmethod
    async def upsert(db: AsyncSession, project_id: str, data: dict):
        stmt = select(LLMNode).where(LLMNode.project_id == project_id)
        result = await db.execute(stmt)
        node = result.scalar_one_or_none()
        if node:
            for k, v in data.items():
                setattr(node, k, v)
            await db.commit()
            await db.refresh(node)
            return node
        else:
            return await LLMNodeRepository.create(db, data)
