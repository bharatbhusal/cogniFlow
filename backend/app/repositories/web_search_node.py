from sqlalchemy.ext.asyncio import AsyncSession
from app.models.web_search_node import WebSearchNode
from sqlalchemy.future import select

class WebSearchNodeRepository:
    @staticmethod
    async def create(db: AsyncSession, data: dict):
        node = WebSearchNode(**data)
        db.add(node)
        await db.commit()
        await db.refresh(node)
        return node

    @staticmethod
    async def upsert(db: AsyncSession, project_id: str, data: dict):
        stmt = select(WebSearchNode).where(WebSearchNode.project_id == project_id)
        result = await db.execute(stmt)
        node = result.scalar_one_or_none()
        if node:
            for k, v in data.items():
                setattr(node, k, v)
            await db.commit()
            await db.refresh(node)
            return node
        else:
            return await WebSearchNodeRepository.create(db, data)
