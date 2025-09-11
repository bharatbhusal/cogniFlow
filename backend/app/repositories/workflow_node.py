from sqlalchemy.ext.asyncio import AsyncSession
from app.models.workflow import Workflow
from sqlalchemy.future import select

class WorkflowNodeRepository:
    @staticmethod
    async def create(db: AsyncSession, data: dict):
        node = Workflow(**data)
        db.add(node)
        await db.commit()
        await db.refresh(node)
        return node

    @staticmethod
    async def upsert(db: AsyncSession, project_id: str, data: dict):
        stmt = select(Workflow).where(Workflow.project_id == project_id)
        result = await db.execute(stmt)
        node = result.scalar_one_or_none()
        if node:
            for k, v in data.items():
                setattr(node, k, v)
            await db.commit()
            await db.refresh(node)
            return node
        else:
            return await WorkflowNodeRepository.create(db, data)
