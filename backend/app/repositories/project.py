from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.models.project import Project
from app.types.project import ProjectBase, ProjectCreateDict

class ProjectRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, project_id: str) -> Project | None:
        result = await db.execute(
            select(Project)
            .options(selectinload(Project.documents))
            .options(selectinload(Project.messages))
            .options(selectinload(Project.owner))
            .where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_owner_id(db: AsyncSession, owner_id: str) -> List[Project]:
        result = await db.execute(
            select(Project)
            .options(selectinload(Project.documents))
            .options(selectinload(Project.messages))
            .options(selectinload(Project.owner))
            .where(Project.owner_id == owner_id)
            .order_by(Project.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, project: ProjectCreateDict) -> Project:
        db_project = Project(**project)
        db.add(db_project)
        await db.commit()
        await db.refresh(db_project)
        return db_project

    @staticmethod
    async def update(db: AsyncSession, project_id: str, project_data: ProjectBase) -> Project | None:
        result = await db.execute(select(Project).where(Project.id == project_id))
        db_project = result.scalar_one_or_none()
        
        if db_project:
            for key, value in project_data.model_dump().items():
                setattr(db_project, key, value)
            await db.commit()
            await db.refresh(db_project)
        
        return db_project

    @staticmethod
    async def delete(db: AsyncSession, project_id: str) -> bool:
        result = await db.execute(select(Project).where(Project.id == project_id))
        db_project = result.scalar_one_or_none()
        
        if db_project:
            await db.delete(db_project)
            await db.commit()
            return True
        
        return False
