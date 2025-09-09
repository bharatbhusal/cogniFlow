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
from app.repositories.document import DocumentRepository
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.db import get_db
from app.utils.cuid_str import cuid_str


router = APIRouter()

@router.get("/")
async def list_projects(db: AsyncSession = Depends(get_db), user: AuthJWTTokenDict = Depends(get_current_user)):
    return await ProjectRepository.get_by_owner_id(db, user["id"])

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
        
    project = await ProjectRepository.create(
        db=db,
        project={
            "name": name,
            "description": description,
            "owner_id": user["id"]
        }
    )
    processed_files = []
    for pdf_file in pdf_files:
        content = await pdf_file.read()
        document_id = cuid_str()
        processed_document = await knowledge_base_service.process_document_from_memory(
            content=content,
            filename=pdf_file.filename,
            document_id=document_id,
            chunk_size=1000,
            chunk_overlap=200
        )
        await pdf_file.seek(0)
        processed_files.append(processed_document)

        await DocumentRepository.create(
            db=db,
            document={"title": processed_document["filename"], "project_id": project.id, "chroma_document_id": processed_document["document_id"]}
        )
        
    return {
        "msg": "Project created and PDFs processed successfully",
        "project_id": project.id,
        "name": name,
        "description": description,
        "total_files": len(processed_files),
        "files": processed_files
    }

@router.get("/{project_id}")
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    """Get project details and document status"""
    try:
        return await ProjectRepository.get_by_id(db, project_id)
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Project not found or error retrieving status: {str(e)}"
        )

@router.put("/{project_id}")
async def update_project(
    project_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    pdf_files: Optional[list[UploadFile]] = File(None),
    delete_documents: Optional[str] = Form(None),  # Comma-separated document IDs to delete
    user: AuthJWTTokenDict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update project: name, description, add PDFs, or delete documents
    - name: New project name (optional)
    - description: New project description (optional)  
    - pdf_files: New PDF files to add (optional)
    - delete_documents: Comma-separated list of document IDs to delete (optional)
    """
    
    # Check if project exists and user owns it
    project = await ProjectRepository.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.owner_id != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this project")
    
    update_data = {}

    
    # Update project name and description
    if name is not None:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description
    
    if update_data:
        updated_project = await ProjectRepository.update(db, project_id, update_data)
    else:
        updated_project = project
    
    # Delete specified documents
    if delete_documents:
        document_ids_to_delete = [doc_id.strip() for doc_id in delete_documents.split(",") if doc_id.strip()]
        
        for doc_id in document_ids_to_delete:
            print("\n\nDeleting document:", doc_id)
            try:
                # Get document to verify it belongs to this project
                document = await DocumentRepository.get_by_id(db, doc_id)
                if document and document.project_id == project_id:
                    # Delete from ChromaDB first
                    knowledge_base_service.delete_document(doc_id)
                    await DocumentRepository.delete(db, doc_id)
                else:
                    raise HTTPException(
                        status_code=404, 
                        detail=f"Document {doc_id} not found or doesn't belong to this project"
                    )
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Error deleting document {doc_id}: {str(e)}"
                )
    
    # Add new PDF files
    if pdf_files:
        # Validate new PDF files
        for pdf_file in pdf_files:
            if pdf_file.content_type != "application/pdf":
                raise HTTPException(
                    status_code=400,
                    detail=f"File '{pdf_file.filename}' is not a PDF. Only PDF files are allowed."
                )
            
            if pdf_file.size > 20 * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail=f"File '{pdf_file.filename}' is too large. Maximum size is 20MB per file."
                )
        
        # Process new PDF files
        for pdf_file in pdf_files:
            try:
                content = await pdf_file.read()
                document_id = cuid_str()
                
                # Process PDF and store in ChromaDB
                await knowledge_base_service.process_document_from_memory(
                    content=content,
                    filename=pdf_file.filename,
                    document_id=document_id,
                    chunk_size=1000,
                    chunk_overlap=200
                )
                
                # Create document record in PostgreSQL
                await DocumentRepository.create(
                    db=db,
                    document={
                        "title": pdf_file.filename,
                        "project_id": project_id,
                        "chroma_document_id": document_id,
                    }
                )
                await pdf_file.seek(0)
                
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Error processing PDF '{pdf_file.filename}': {str(e)}"
                )
    
    response = {
        "msg": "Project updated successfully",
        "project_id": project_id,
        "name": updated_project.name,
        "description": updated_project.description,
    }
    
    return response

@router.delete("/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db), user: AuthJWTTokenDict = Depends(get_current_user)):
    """Delete project and all its documents"""
    try:
        documents = await DocumentRepository.get_by_project_id(db, project_id)
        for doc in documents:
            knowledge_base_service.delete_document(doc.chroma_document_id)
        await ProjectRepository.delete(db, project_id)
        return {"msg": f"Project {project_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting project: {str(e)}"
        )
