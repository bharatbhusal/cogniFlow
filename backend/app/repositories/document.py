from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.models.document import Document
from app.types.document import DocumentCreate, DocumentUpdate, DocumentCreateDict

class DocumentRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, document_id: str) -> Document | None:
        result = await db.execute(select(Document).options(selectinload(Document.project)).where(Document.id == document_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_project_id(db: AsyncSession, project_id: str) -> List[Document]:
        result = await db.execute(
            select(Document).where(Document.project_id == project_id)
        )
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, document: DocumentCreateDict) -> Document:
        db_document = Document(**document)
        db.add(db_document)
        await db.commit()
        await db.refresh(db_document)
        return db_document

    @staticmethod
    async def update(db: AsyncSession, document_id: str, document_data: DocumentUpdate) -> Document | None:
        result = await db.execute(select(Document).where(Document.id == document_id))
        db_document = result.scalar_one_or_none()
        
        if db_document:
            for key, value in document_data.model_dump().items():
                setattr(db_document, key, value)
            await db.commit()
            await db.refresh(db_document)
        
        return db_document

    @staticmethod
    async def delete(db: AsyncSession, document_id: str) -> bool:
        result = await db.execute(select(Document).where(Document.id == document_id))
        db_document = result.scalar_one_or_none()
        
        if db_document:
            await db.delete(db_document)
            await db.commit()
            return True
        
        return False