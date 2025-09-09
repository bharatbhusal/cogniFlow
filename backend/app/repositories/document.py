from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_
from typing import List, Dict, Any
from app.models.document import Document

class DocumentRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, document_id: str) -> Document | None:
        result = await db.execute(
            select(Document)
            .options(selectinload(Document.project))
            .where(Document.id == document_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_project_id(db: AsyncSession, project_id: str) -> List[Document]:
        result = await db.execute(
            select(Document)
            .where(Document.project_id == project_id)
            .order_by(Document.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_project_and_hash(
        db: AsyncSession, 
        project_id: str, 
        content_hash: str
    ) -> Document | None:
        """Get document by project ID and content hash to prevent duplicates"""
        result = await db.execute(
            select(Document).where(
                and_(Document.project_id == project_id, Document.content_hash == content_hash)
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, document: Dict[str, Any]) -> Document:
        db_document = Document(**document)
        db.add(db_document)
        await db.commit()
        await db.refresh(db_document)
        return db_document

    @staticmethod
    async def update(
        db: AsyncSession, 
        document_id: str, 
        document_data: Dict[str, Any]
    ) -> Document | None:
        result = await db.execute(select(Document).where(Document.id == document_id))
        db_document = result.scalar_one_or_none()
        
        if db_document:
            for key, value in document_data.items():
                if hasattr(db_document, key):
                    setattr(db_document, key, value)
            await db.commit()
            await db.refresh(db_document)
        
        return db_document

    @staticmethod
    async def get_chromadb_chunk_ids(db: AsyncSession, document_id: str) -> List[str]:
        """Get ChromaDB chunk IDs for a document"""
        result = await db.execute(
            select(Document.chroma_chunk_ids).where(Document.id == document_id)
        )
        chunk_ids = result.scalar_one_or_none()
        return chunk_ids if chunk_ids else []

    @staticmethod
    async def get_project_chromadb_chunk_ids(db: AsyncSession, project_id: str) -> List[str]:
        """Get all ChromaDB chunk IDs for a project"""
        result = await db.execute(
            select(Document.chroma_chunk_ids).where(Document.project_id == project_id)
        )
        all_chunk_ids = []
        for chunk_ids in result.scalars().all():
            if chunk_ids:
                all_chunk_ids.extend(chunk_ids)
        return all_chunk_ids

    @staticmethod
    async def delete(db: AsyncSession, document_id: str) -> bool:
        result = await db.execute(select(Document).where(Document.id == document_id))
        db_document = result.scalar_one_or_none()
        
        if db_document:
            await db.delete(db_document)
            await db.commit()
            return True
        
        return False