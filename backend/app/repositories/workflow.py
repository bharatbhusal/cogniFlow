from sqlalchemy.ext.asyncio import AsyncSession
from app.models.workflow import Workflow
from sqlalchemy.future import select

class WorkflowRepository:
    @staticmethod
    async def create(db: AsyncSession, project_id: str, data: dict):
        workflow = Workflow(**data, project_id=project_id)
        db.add(workflow)
        await db.commit()
        await db.refresh(workflow)
        return workflow

    @staticmethod
    async def upsert(db: AsyncSession, project_id: str, data: dict):
        stmt = select(Workflow).where(Workflow.project_id == project_id)
        result = await db.execute(stmt)
        workflow = result.scalar_one_or_none()
        if workflow:
            for k, v in data.items():
                setattr(workflow, k, v)
            await db.commit()
            await db.refresh(workflow)
            return workflow
        else:
            return await WorkflowRepository.create(db, data)
