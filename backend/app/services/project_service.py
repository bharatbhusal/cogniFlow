from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, UploadFile
import hashlib
from app.repositories.project import ProjectRepository
from app.repositories.document import DocumentRepository
from app.services.knowledge_base import knowledge_base_service
from app.types.responses import *
from app.utils.cuid_str import cuid_str


class ProjectService:

    @staticmethod
    async def get_user_projects(db: AsyncSession, user_id: str) -> List[Dict[str, Any]]:
        """Get all projects for a user"""
        try:
            projects = await ProjectRepository.get_by_owner_id(db, user_id)

            # Convert SQLAlchemy model objects to dictionaries
            return [
                {
                    "id": project.id,
                    "name": project.name,
                    "description": project.description,
                    "owner_id": project.owner_id,
                    "created_at": (
                        project.created_at.isoformat() if project.created_at else None
                    ),
                    "updated_at": (
                        project.updated_at.isoformat() if project.updated_at else None
                    ),
                    "documents_count": (
                        len(project.documents) if project.documents else 0
                    ),
                    "messages_count": len(project.messages) if project.messages else 0,
                    "documents": [
                        {
                            "id": doc.id,
                            "title": doc.title,
                            "chroma_document_id": doc.chroma_document_id,
                        }
                        for doc in (project.documents or [])
                    ],
                }
                for project in projects
            ]
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error retrieving projects: {str(e)}"
            )

    @staticmethod
    async def get_project_details(
        db: AsyncSession, project_id: str, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get detailed project information"""
        try:
            project = await ProjectRepository.get_by_id(db, project_id)
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")

            # Check ownership if user_id is provided
            if user_id and project.owner_id != user_id:
                raise HTTPException(
                    status_code=403, detail="Not authorized to access this project"
                )

            return {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "owner_id": project.owner_id,
                "documents": [
                    {
                        "id": doc.id,
                        "title": doc.title,
                        "chroma_document_id": doc.chroma_document_id,
                    }
                    for doc in (project.documents or [])
                ],
                "messages": [
                    {
                        "id": msg.id,
                        "content": msg.content,
                        "created_at": msg.created_at.isoformat()
                        if msg.created_at
                        else None,
                    }
                    for msg in (project.messages or [])
                ],
                "messages_count": len(project.messages) if project.messages else 0,
                "total_documents": len(project.documents) if project.documents else 0,
                "created_at": (
                    project.created_at.isoformat() if project.created_at else None
                ),
                "updated_at": (
                    project.updated_at.isoformat() if project.updated_at else None
                ),
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error retrieving project details: {str(e)}"
            )

    @staticmethod
    async def create_project_with_documents(
        db: AsyncSession,
        name: str,
        user_id: str,
        description: Optional[str] = None,
        pdf_files: Optional[List[UploadFile]] = None,
    ) -> Dict[str, Any]:
        """Create a new project and process uploaded documents"""
        try:
            # Validate PDF files if provided
            if pdf_files:
                for pdf_file in pdf_files:
                    if pdf_file.content_type != "application/pdf":
                        raise HTTPException(
                            status_code=400,
                            detail=f"File '{pdf_file.filename}' is not a PDF",
                        )
                    if pdf_file.size > 20 * 1024 * 1024:  # 20MB limit
                        raise HTTPException(
                            status_code=400,
                            detail=f"File '{pdf_file.filename}' exceeds 20MB limit",
                        )

            # Create project
            project_data = {
                "name": name,
                "description": description or "",
                "owner_id": user_id,
            }
            project = await ProjectRepository.create(db, project_data)

            # Process PDF files
            processed_files = []
            if pdf_files:
                for pdf_file in pdf_files:
                    try:
                        content = await pdf_file.read()
                        content_hash = hashlib.md5(content).hexdigest()
                        document_id = cuid_str()

                        # Process document through knowledge base
                        processing_result = (
                            await knowledge_base_service.process_document_from_memory(
                                content=content,
                                filename=pdf_file.filename,
                                document_id=document_id,
                                chunk_size=1000,
                                chunk_overlap=200,
                            )
                        )

                        # Save document to database
                        document_data = {
                            "chroma_document_id": document_id,
                            "title": pdf_file.filename,
                            "project_id": project.id,
                            "chroma_chunk_ids": processing_result.get("chunk_ids", []),
                            "content_hash": content_hash,
                            "pages": processing_result.get("pages", 0),
                            "total_chunks": processing_result.get("total_chunks", 0),
                        }
                        await DocumentRepository.create(db, document_data)

                        processed_files.append(
                            {
                                "chroma_document_id": document_id,
                                "filename": pdf_file.filename,
                                "size": len(content),
                                "pages": processing_result.get("pages", 0),
                                "total_chunks": processing_result.get(
                                    "total_chunks", 0
                                ),
                                "status": "completed",
                            }
                        )

                        await pdf_file.seek(0)
                    except Exception as e:
                        # If document processing fails, we should still return the project
                        # but indicate which files failed
                        processed_files.append(
                            {
                                "filename": pdf_file.filename,
                                "status": "failed",
                                "error": str(e),
                            }
                        )

            return {
                "project_id": project.id,
                "name": project.name,
                "description": project.description,
                "total_files": len(processed_files),
                "processed_files": processed_files,
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error creating project: {str(e)}"
            )

    @staticmethod
    async def update_project(
        db: AsyncSession,
        project_id: str,
        user_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        pdf_files: Optional[List[UploadFile]] = None,
        delete_document_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Update project with new information, files, or deletions"""
        try:
            # Verify project exists and user owns it
            project = await ProjectRepository.get_by_id(db, project_id)
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            if project.owner_id != user_id:
                raise HTTPException(
                    status_code=403, detail="Not authorized to update this project"
                )

            # Update project details
            update_data = {}
            if name is not None:
                update_data["name"] = name
            if description is not None:
                update_data["description"] = description

            if update_data:
                project = await ProjectRepository.update(db, project_id, update_data)

            # Track changes
            changes = {
                "name_updated": name is not None,
                "description_updated": description is not None,
                "files_added": 0,
                "files_deleted": 0,
                "new_files": [],
                "deleted_files": [],
            }

            # Delete specified documents
            if delete_document_ids:
                for doc_id in delete_document_ids:
                    document = await DocumentRepository.get_by_id(db, doc_id)
                    if document and document.project_id == project_id:
                        # Delete from ChromaDB
                        chromadb_deleted = knowledge_base_service.delete_document(
                            doc_id
                        )

                        # Delete from PostgreSQL
                        postgres_deleted = await DocumentRepository.delete(db, doc_id)

                        changes["deleted_files"].append(
                            {
                                "document_id": doc_id,
                                "filename": document.title,
                                "deleted_from_chromadb": chromadb_deleted,
                                "deleted_from_postgres": postgres_deleted,
                                "status": (
                                    "deleted"
                                    if (chromadb_deleted and postgres_deleted)
                                    else "partial_delete"
                                ),
                            }
                        )
                        changes["files_deleted"] += 1

            # Add new PDF files
            if pdf_files:
                for pdf_file in pdf_files:
                    try:
                        content = await pdf_file.read()
                        content_hash = hashlib.md5(content).hexdigest()

                        # Check for duplicates
                        existing_doc = await DocumentRepository.get_by_project_and_hash(
                            db, project_id, content_hash
                        )
                        if existing_doc:
                            changes["new_files"].append(
                                {
                                    "filename": pdf_file.filename,
                                    "status": "duplicate_skipped",
                                    "existing_document_id": existing_doc.id,
                                }
                            )
                            continue

                        document_id = cuid_str()

                        # Process document
                        processing_result = (
                            await knowledge_base_service.process_document_from_memory(
                                content=content,
                                filename=pdf_file.filename,
                                document_id=document_id,
                                chunk_size=1000,
                                chunk_overlap=200,
                            )
                        )

                        # Save to database
                        document_data = {
                            "chroma_document_id": document_id,
                            "title": pdf_file.filename,
                            "project_id": project_id,
                            "chroma_chunk_ids": processing_result.get("chunk_ids", []),
                            "content_hash": content_hash,
                            "pages": processing_result.get("pages", 0),
                            "total_chunks": processing_result.get("total_chunks", 0),
                        }
                        await DocumentRepository.create(db, document_data)

                        changes["new_files"].append(
                            {
                                "document_id": document_id,
                                "filename": pdf_file.filename,
                                "size": len(content),
                                "pages": processing_result.get("pages", 0),
                                "total_chunks": processing_result.get(
                                    "total_chunks", 0
                                ),
                                "status": "added",
                            }
                        )
                        changes["files_added"] += 1

                        await pdf_file.seek(0)
                    except Exception as e:
                        changes["new_files"].append(
                            {
                                "filename": pdf_file.filename,
                                "status": "failed",
                                "error": str(e),
                            }
                        )

            # Get updated project info
            updated_project = await ProjectRepository.get_by_id(db, project_id)
            current_doc_count = (
                len(updated_project.documents) if updated_project.documents else 0
            )

            return {
                "project_id": project_id,
                "name": updated_project.name,
                "description": updated_project.description,
                "updates": changes,
                "current_documents_count": current_doc_count,
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error updating project: {str(e)}"
            )

    @staticmethod
    async def delete_project(
        db: AsyncSession, project_id: str, user_id: str
    ) -> Dict[str, Any]:
        """Delete project and all associated documents"""
        try:
            project = await ProjectRepository.get_by_id(db, project_id)
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            if project.owner_id != user_id:
                raise HTTPException(
                    status_code=403, detail="Not authorized to delete this project"
                )

            # Delete documents from ChromaDB
            documents = await DocumentRepository.get_by_project_id(db, project_id)
            deleted_documents = []

            for doc in documents:
                chromadb_deleted = knowledge_base_service.delete_document(doc.id)
                deleted_documents.append(
                    {
                        "document_id": doc.id,
                        "title": doc.title,
                        "chromadb_deleted": chromadb_deleted,
                    }
                )

            # Delete project (cascade will delete documents from PostgreSQL)
            project_deleted = await ProjectRepository.delete(db, project_id)

            return {
                "project_id": project_id,
                "name": project.name,
                "documents_deleted": len(deleted_documents),
                "deleted_documents": deleted_documents,
                "project_deleted": project_deleted,
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error deleting project: {str(e)}"
            )
