from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from typing import Optional
import fitz  # PyMuPDF
from io import BytesIO
import hashlib
import uuid
from app.services.knowledge_base import knowledge_base_service
from app.types.user import AuthJWTTokenDict
from app.middlewares.auth_middleware import get_current_user
from app.repositories.project import ProjectRepository
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.db import get_db


router = APIRouter()

@router.get("/")
def list_projects():
    return []

@router.post("")
async def create_project(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    pdf_files: list[UploadFile] = File(...),
    user: AuthJWTTokenDict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not pdf_files:
        raise HTTPException(
            status_code=400,
            detail="At least one PDF file is required"
        )
    
    
    # processed_files = []
    # project_id = str(uuid.uuid4())
    
    for pdf_file in pdf_files:
        # Validate file type
        if pdf_file.content_type != "application/pdf":
            raise HTTPException(
                status_code=400,
                detail=f"File '{pdf_file.filename}' is not a PDF. Only PDF files are allowed."
            )
        
        # Validate file size (e.g., max 20MB per file)
        if pdf_file.size > 20 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File '{pdf_file.filename}' is too large. Maximum size is 20MB per file."
            )
        
        # try:
        #     # Read file content into memory
        #     content = await pdf_file.read()
            
        #     # Generate unique document ID
        #     document_id = f"{project_id}_{hashlib.md5(content).hexdigest()[:8]}"
            
        #     # Process PDF in memory and store in ChromaDB
        #     processing_result = await knowledge_base_service.process_document_from_memory(
        #         content=content,
        #         filename=pdf_file.filename,
        #         document_id=document_id,
        #         project_id=project_id,
        #         chunk_size=1000,
        #         chunk_overlap=200
        #     )
            
        #     processed_files.append({
        #         "filename": pdf_file.filename,
        #         "document_id": document_id,
        #         "size": len(content),
        #         "pages": processing_result.get("pages", 0),
        #         "total_chunks": processing_result.get("total_chunks", 0),
        #         "status": processing_result.get("status", "completed")
        #     })
            
        #     # Reset file pointer for potential reuse
        #     await pdf_file.seek(0)
            
        # except Exception as e:
        #     raise HTTPException(
        #         status_code=400,
        #         detail=f"Error processing PDF '{pdf_file.filename}': {str(e)}"
        #     )

    project = await ProjectRepository.create(
        db=db,
        project={
            "name": name,
            "description": description,
            "owner_id": user["id"]
        }
    )
    print("Created project:", project)
    
    return {
        "msg": "Project created and PDFs processed successfully",
        "project_id": project.id,
        "name": name,
        "description": description,
        # "total_files": len(processed_files),
        # "files": processed_files
    }

@router.get("/{project_id}")
async def get_project(project_id: str):
    """Get project details and document status"""
    try:
        project_status = await knowledge_base_service.get_project_status(project_id)
        return project_status
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Project not found or error retrieving status: {str(e)}"
        )

@router.post("/{project_id}/query")
async def query_project(
    project_id: str,
    query: str = Form(...),
    n_results: int = Form(5)
):
    """Query documents within a specific project"""
    try:
        # Get document IDs for this project
        project_docs = await knowledge_base_service.get_project_documents(project_id)
        
        if not project_docs:
            raise HTTPException(
                status_code=404,
                detail="No documents found for this project"
            )
        
        document_ids = [doc["document_id"] for doc in project_docs]
        
        # Retrieve relevant context
        context_chunks = await knowledge_base_service.retrieve_relevant_context(
            query=query,
            n_results=n_results,
            document_ids=document_ids
        )
        
        return {
            "query": query,
            "project_id": project_id,
            "results": context_chunks
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error querying project: {str(e)}"
        )

@router.put("/{project_id}")
def update_project(project_id: str):
    return {"msg": f"Project {project_id} updated"}

@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete project and all its documents"""
    try:
        deleted = await knowledge_base_service.delete_project(project_id)
        if deleted:
            return {"msg": f"Project {project_id} deleted successfully"}
        else:
            raise HTTPException(
                status_code=404,
                detail="Project not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting project: {str(e)}"
        )
