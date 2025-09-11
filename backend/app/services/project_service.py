from app.repositories.knowledge_base_node import KnowledgeBaseNodeRepository
from app.repositories.llm_node import LlmNodeRepository
from app.repositories.web_search_node import WebSearchNodeRepository
from app.repositories.workflow import WorkflowRepository
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, UploadFile
import hashlib
from app.repositories.project import ProjectRepository
from app.repositories.document import DocumentRepository
from app.services.knowledge_base import knowledge_base_service
from app.types.responses import *
from app.utils.cuid_str import cuid_str
from app.utils.pockity import upload_file_to_pockity
import json
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
                            "file_url": doc.file_url,
                        }
                        for doc in (project.documents or [])
                    ],
                    "workflow": project.workflow.definition if project.workflow else None,
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
                        "file_url": doc.file_url,
                    }
                    for doc in (project.documents or [])
                ],
                "messages": [
                    {       
                        "id": msg.id,
                        "content": msg.content,
                        "role": msg.role,
                        "created_at": msg.created_at.isoformat()
                        if msg.created_at
                        else None,
                    }
                    for msg in (project.messages or [])
                ],
                "messages_count": len(project.messages) if project.messages else 0,
                "documents_count": len(project.documents) if project.documents else 0,
                "created_at": (
                    project.created_at.isoformat() if project.created_at else None
                ),
                "updated_at": (
                    project.updated_at.isoformat() if project.updated_at else None
                ),
                "workflow": project.workflow.definition if project.workflow else None,
                "llm_node": {
                    "openai_api_key": project.llm_node.openai_api_key if project.llm_node else None,
                    "llm_model_name": project.llm_node.llm_model_name if project.llm_node else None,
                },
                "web_search_node": {
                    "serpapi_api_key": project.web_search_node.serpapi_api_key if project.web_search_node else None,
                },
                "knowledge_base_node": {
                    "openai_api_key": project.knowledge_base_node.openai_api_key if project.knowledge_base_node else None,
                    "embedding_model_name": project.knowledge_base_node.embedding_model_name if project.knowledge_base_node else None,
                },
                

            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error retrieving project details: {str(e)}"
            )

    @staticmethod
    async def create_project(
        db: AsyncSession,
        name: str,
        user_id: str,
        description: Optional[str] = None,
        pdf_files: Optional[List[UploadFile]] = None,
        workflow: Optional[str] = None,
        kb_node_config: Optional[str] = None,
        llm_node_config: Optional[str] = None,
        web_search_node_config: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new project and process uploaded documents, workflow, and node configs"""
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

            # Workflow and node config logic
            workflow_flags = ProjectService._parse_workflow(workflow)
            if workflow_flags["hasKb"]:
                kb_node_config_dict = ProjectService._validate_kb_config(kb_node_config)
                from app.repositories.knowledge_base_node import KnowledgeBaseNodeRepository
                await KnowledgeBaseNodeRepository.create(db=db, project_id=project.id, data={
                    "openai_api_key": kb_node_config_dict["openai_api_key"],
                    "embedding_model_name": kb_node_config_dict["embedding_model_name"],
                })
            if workflow_flags["hasLlm"]:
                llm_node_config_dict = ProjectService._validate_llm_config(llm_node_config)
                from app.repositories.llm_node import LlmNodeRepository
                await LlmNodeRepository.create(db=db, project_id=project.id, data={
                    "openai_api_key": llm_node_config_dict["openai_api_key"],
                    "llm_model_name": llm_node_config_dict["llm_model_name"],
                })
            if workflow_flags["hasWeb"]:
                web_search_node_config_dict = ProjectService._validate_web_config(web_search_node_config)
                from app.repositories.web_search_node import WebSearchNodeRepository
                await WebSearchNodeRepository.create(db=db, project_id=project.id, data={
                    "serpapi_api_key": web_search_node_config_dict["serpapi_api_key"]
                })
            if workflow and isinstance(workflow, str) and workflow.strip():
                from app.repositories.workflow import WorkflowRepository
                await WorkflowRepository.create(db=db, project_id=project.id, data={
                    "definition": workflow
                })

            # Process PDF files
            processed_documents = []
            if pdf_files:
                for pdf_file in pdf_files:
                    try:
                        file_upload_result = upload_file_to_pockity(pdf_file.file, filename=pdf_file.filename)
                        if not file_upload_result or file_upload_result.get("error"):
                            processed_documents.append({
                                "title": pdf_file.filename,
                                "status": "file_upload_failed",
                                "error": (
                                    file_upload_result.get("error", {}).get("message")
                                    or file_upload_result.get("error", {}).get("name")
                                    or "Unknown error"
                                ),
                            })
                            continue
                        file_url = file_upload_result.get("data", {}).get("url")
                        pdf_file.file.seek(0)
                        content = await pdf_file.read()
                        content_hash = hashlib.md5(content).hexdigest()
                        document_id = cuid_str()
                        processing_result = (
                            await knowledge_base_service.process_document(
                                content=content,
                                filename=pdf_file.filename,
                                document_id=document_id,
                                chunk_size=1000,
                                chunk_overlap=200,
                            )
                        )
                        document_data = {
                            "chroma_document_id": document_id,
                            "title": pdf_file.filename,
                            "project_id": project.id,
                            "chroma_chunk_ids": processing_result.get("chunk_ids", []),
                            "content_hash": content_hash,
                            "pages": processing_result.get("pages", 0),
                            "total_chunks": processing_result.get("total_chunks", 0),
                            "file_url": file_url,
                        }
                        await DocumentRepository.create(db, document_data)
                        processed_documents.append(
                            {
                                "id": document_id,
                                "chroma_document_id": document_id,
                                "title": pdf_file.filename,
                                "size": len(content),
                                "pages": processing_result.get("pages", 0),
                                "total_chunks": processing_result.get("total_chunks", 0),
                                "file_url": file_url,
                                "status": "completed",
                            }
                        )
                        await pdf_file.seek(0)
                    except Exception as e:
                        processed_documents.append(
                            {
                                "title": pdf_file.filename,
                                "status": "failed",
                                "error": str(e),
                            }
                        )
            # Gather node configs and workflow from project relationships
            project = await ProjectRepository.get_by_id(db, project.id)
            workflow_def = project.workflow.definition if project.workflow else None
            kb_node = project.knowledge_base_node if hasattr(project, "knowledge_base_node") else None
            llm_node = project.llm_node if hasattr(project, "llm_node") else None
            web_search_node = project.web_search_node if hasattr(project, "web_search_node") else None

            return {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "total_files": len(processed_documents),
                "documents": processed_documents,
                "created_at": (
                    project.created_at.isoformat()
                    if project.created_at
                    else None
                ),
                "workflow": workflow_def,
                "kb_node_config": {
                    "openai_api_key": kb_node.openai_api_key if kb_node else None,
                    "embedding_model_name": kb_node.embedding_model_name if kb_node else None,
                },
                "llm_node_config": {
                    "openai_api_key": llm_node.openai_api_key if llm_node else None,
                    "llm_model_name": llm_node.llm_model_name if llm_node else None,
                },
                "web_search_node_config": {
                    "serpapi_api_key": web_search_node.serpapi_api_key if web_search_node else None,
                },
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
        workflow: Optional[str] = None,
        kb_node_config: Optional[str] = None,
        llm_node_config: Optional[str] = None,
        web_search_node_config: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update project with new information, files, deletions, workflow, and node configs"""
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
                "workflow_status": "unchanged",
                "kb_node_status": "unchanged",
                "llm_node_status": "unchanged",
                "web_search_node_status": "unchanged",
            }

            # Delete specified documents
            if delete_document_ids:
                for doc_id in delete_document_ids:
                    document = await DocumentRepository.get_by_id(db, doc_id)
                    if document and document.project_id == project_id:
                        chromadb_deleted = knowledge_base_service.delete_document(doc_id)
                        postgres_deleted = await DocumentRepository.delete(db, doc_id)
                        changes["deleted_files"].append({
                            "id": doc_id,
                            "title": document.title,
                            "deleted_from_chromadb": chromadb_deleted,
                            "deleted_from_postgres": postgres_deleted,
                            "status": "deleted" if (chromadb_deleted and postgres_deleted) else "partial_delete",
                        })
                        changes["files_deleted"] += 1

            # Add new PDF files
            if pdf_files:
                for pdf_file in pdf_files:
                    try:
                        file_upload_result = upload_file_to_pockity(pdf_file.file, filename=pdf_file.filename)
                        if not file_upload_result or file_upload_result.get("error"):
                            changes["new_files"].append({
                                "filename": pdf_file.filename,
                                "status": "file_upload_failed",
                                "error": file_upload_result.get("error", {}).get("message") or file_upload_result.get("error", {}).get("name") or "Unknown error",
                            })
                            continue
                        file_url = file_upload_result.get("data", {}).get("url")
                        pdf_file.file.seek(0)
                        content = await pdf_file.read()
                        content_hash = hashlib.md5(content).hexdigest()
                        existing_doc = await DocumentRepository.get_by_project_and_hash(db, project_id, content_hash)
                        if existing_doc:
                            changes["new_files"].append({
                                "title": pdf_file.filename,
                                "status": "duplicate_skipped",
                                "existing_document_id": existing_doc.id,
                            })
                            continue
                        document_id = cuid_str()
                        processing_result = (
                            await knowledge_base_service.process_document(
                                content=content,
                                filename=pdf_file.filename,
                                document_id=document_id,
                                chunk_size=1000,
                                chunk_overlap=200,
                            )
                        )
                        document_data = {
                            "chroma_document_id": document_id,
                            "title": pdf_file.filename,
                            "project_id": project_id,
                            "chroma_chunk_ids": processing_result.get("chunk_ids", []),
                            "content_hash": content_hash,
                            "pages": processing_result.get("pages", 0),
                            "total_chunks": processing_result.get("total_chunks", 0),
                            "file_url": file_url,
                        }
                        new_document = await DocumentRepository.create(db, document_data)
                        changes["new_files"].append({
                            "id": new_document.id,
                            "title": new_document.title,
                            "size": len(content),
                            "pages": processing_result.get("pages", 0),
                            "total_chunks": processing_result.get("total_chunks", 0),
                            "file_url": new_document.file_url,
                            "status": "added",
                        })
                        changes["files_added"] += 1
                        await pdf_file.seek(0)
                    except Exception as e:
                        changes["new_files"].append({
                            "title": pdf_file.filename,
                            "status": "failed",
                            "error": str(e),
                        })

            # Only update workflow if provided, and validate it first
            workflow_flags = None
            if workflow is not None:
                workflow_flags = ProjectService._parse_workflow(workflow)  # will raise if invalid
                if (project and project.workflow and project.workflow.definition != workflow):
                    await WorkflowRepository.upsert(db=db, project_id=project_id, data={
                        "definition": workflow
                    })
                    changes["workflow_status"] = { "status": "updated", "from": project.workflow.definition, "to": workflow }
                else:
                    changes["workflow_status"] = { "status": "unchanged" }

            # Get current project nodes
            updated_project = await ProjectRepository.get_by_id(db, project_id)
            await db.refresh(updated_project)
            kb_node_exists = updated_project.knowledge_base_node is not None
            llm_node_exists = updated_project.llm_node is not None
            web_node_exists = updated_project.web_search_node is not None

            # If workflow requires KB node, ensure it exists or config is provided
            if workflow_flags and workflow_flags["hasKb"]:
                if not kb_node_exists:
                    if kb_node_config is None:
                        raise HTTPException(status_code=400, detail="Knowledge Base node required by workflow but not present. Please provide kb_node_config.")
                    kb_node_config_dict = ProjectService._validate_kb_config(kb_node_config)
                    await KnowledgeBaseNodeRepository.create(db=db, project_id=project_id, data={
                        "openai_api_key": kb_node_config_dict.get("openai_api_key"),
                        "embedding_model_name": kb_node_config_dict.get("embedding_model_name"),
                    })
                    changes["kb_node_status"] = "created"
                elif kb_node_config is not None:
                    kb_node_config_dict = ProjectService._validate_kb_config(kb_node_config)
                    await KnowledgeBaseNodeRepository.upsert(db=db, project_id=project_id, data={
                        "openai_api_key": kb_node_config_dict.get("openai_api_key"),
                        "embedding_model_name": kb_node_config_dict.get("embedding_model_name"),
                    })
                    changes["kb_node_status"] = "updated"

            # If workflow requires LLM node, ensure it exists or config is provided
            if workflow_flags and workflow_flags["hasLlm"]:
                if not llm_node_exists:
                    if llm_node_config is None:
                        raise HTTPException(status_code=400, detail="LLM node required by workflow but not present. Please provide llm_node_config.")
                    llm_node_config_dict = ProjectService._validate_llm_config(llm_node_config)
                    await LlmNodeRepository.create(db=db, project_id=project_id, data={
                        "openai_api_key": llm_node_config_dict.get("openai_api_key"),
                        "llm_model_name": llm_node_config_dict.get("llm_model_name"),
                    })
                    changes["llm_node_status"] = "created"
                elif llm_node_config is not None:
                    llm_node_config_dict = ProjectService._validate_llm_config(llm_node_config)
                    await LlmNodeRepository.upsert(db=db, project_id=project_id, data={
                        "openai_api_key": llm_node_config_dict.get("openai_api_key"),
                        "llm_model_name": llm_node_config_dict.get("llm_model_name"),
                    })
                    changes["llm_node_status"] = "updated"

            # If workflow requires Web Search node, ensure it exists or config is provided
            if workflow_flags and workflow_flags["hasWeb"]:
                if not web_node_exists:
                    if web_search_node_config is None:
                        raise HTTPException(status_code=400, detail="Web Search node required by workflow but not present. Please provide web_search_node_config.")
                    web_search_node_config_dict = ProjectService._validate_web_config(web_search_node_config)
                    await WebSearchNodeRepository.create(db=db, project_id=project_id, data={
                        "serpapi_api_key": web_search_node_config_dict.get("serpapi_api_key")
                    })
                    changes["web_search_node_status"] = "created"
                elif web_search_node_config is not None:
                    web_search_node_config_dict = ProjectService._validate_web_config(web_search_node_config)
                    await WebSearchNodeRepository.upsert(db=db, project_id=project_id, data={
                        "serpapi_api_key": web_search_node_config_dict.get("serpapi_api_key")
                    })
                    changes["web_search_node_status"] = "updated"

            return {
                "id": project_id,
                "name": updated_project.name,
                "description": updated_project.description,
                "updates": changes,
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
    
    @staticmethod
    def _parse_workflow(workflow: Optional[str]) -> Dict[str, bool]:
        allowed_workflows = {"kb_llm", "kb_llm_web", "web", "llm_web", "llm", "web_llm"}
        if not workflow or not isinstance(workflow, str) or not workflow.strip():
            raise HTTPException(status_code=400, detail=f"Workflow definition is required.")
        if workflow not in allowed_workflows:
            raise HTTPException(status_code=400, detail=f"Invalid workflow definition. Allowed values are: {', '.join(allowed_workflows)}")
        parts = workflow.split("_")
        return {
            "hasKb": "kb" in parts,
            "hasLlm": "llm" in parts,
            "hasWeb": "web" in parts
        }

    @staticmethod
    def _validate_kb_config(kb_node_config: Optional[str]):
        if not (kb_node_config and isinstance(kb_node_config, str)):
            raise HTTPException(status_code=400, detail="Knowledge Base node config required but not provided.")
        kb_node_config = json.loads(kb_node_config)
        if not ("openai_api_key" in kb_node_config and kb_node_config["openai_api_key"] and "embedding_model_name" in kb_node_config and kb_node_config["embedding_model_name"]):
            raise HTTPException(status_code=400, detail="Knowledge Base node config is incomplete.")
        return kb_node_config

    @staticmethod
    def _validate_llm_config(llm_node_config: Optional[str]):
        if not (llm_node_config and isinstance(llm_node_config, str)):
            raise HTTPException(status_code=400, detail="LLM node config required but not provided.")
        llm_node_config = json.loads(llm_node_config)
        if not ("openai_api_key" in llm_node_config and llm_node_config["openai_api_key"] and "llm_model_name" in llm_node_config and llm_node_config["llm_model_name"]):
            raise HTTPException(status_code=400, detail="LLM node config is incomplete.")
        return llm_node_config

    @staticmethod
    def _validate_web_config(web_search_node_config: Optional[str]):
        if not (web_search_node_config and isinstance(web_search_node_config, str)):
            raise HTTPException(status_code=400, detail="Web Search node config required but not provided.")
        web_search_node_config = json.loads(web_search_node_config)
        if not ("serpapi_api_key" in web_search_node_config and web_search_node_config["serpapi_api_key"]):
            raise HTTPException(status_code=400, detail="Web Search node config is incomplete.")
        return web_search_node_config