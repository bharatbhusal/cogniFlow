from sqlalchemy.ext.asyncio import AsyncSession
from app.models.llm_node import LlmNode
from sqlalchemy.future import select

class LlmNodeRepository:
    @staticmethod
    async def create(db: AsyncSession, project_id: str, data: dict):
        node = LlmNode(**data, project_id=project_id)
        db.add(node)
        await db.commit()
        await db.refresh(node)
        return node

    @staticmethod
    async def upsert(db: AsyncSession, project_id: str, data: dict):
        stmt = select(LlmNode).where(LlmNode.project_id == project_id)
        result = await db.execute(stmt)
        node = result.scalar_one_or_none()
        if node:
            for k, v in data.items():
                setattr(node, k, v)
            await db.commit()
            await db.refresh(node)
            return node
        else:
            return await LlmNodeRepository.create(db, data)
