from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import os
import aiofiles
from pathlib import Path

from app.services.openai_service import openai_service
from app.services.knowledge_base import knowledge_base_service
from app.services.workflow_executor import workflow_executor
from app.core.config import get_settings
from app.models.responses import (
    BaseResponse, 
    DocumentUploadResponse,
    WorkflowExecutionResponse,
    DocumentStatusResponse,
    OpenAIError, 
    EmbeddingError,
    ValidationError,
    NotFoundError,
    FileUploadError,
    DocumentProcessingError,
    WorkflowExecutionError,
    InvalidFileTypeError,
    FileSizeExceededError
)

settings = get_settings()
router = APIRouter()

class WorkflowExecutionRequest(BaseModel):
    query: str
    workflow_definition: Dict[str, Any]
    session_id: Optional[str] = None

class EmbeddingRequest(BaseModel):
    texts: List[str]
    model: Optional[str] = None

@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Upload and process a document for the knowledge base"""
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise InvalidFileTypeError(
                message="Only PDF files are supported",
                details=f"Received file type: {file.filename}"
            )
        
        # Validate file size
        if file.size > settings.MAX_FILE_SIZE:
            raise FileSizeExceededError(
                message="File size exceeds maximum allowed size",
                details=f"File size: {file.size} bytes, Max: {settings.MAX_FILE_SIZE} bytes"
            )
        
        # Generate document ID
        document_id = str(uuid.uuid4())
        
        # Ensure upload directory exists
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(exist_ok=True)
        
        # Save uploaded file
        file_path = upload_dir / f"{document_id}_{file.filename}"
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Process document in background
        background_tasks.add_task(
            process_document_background,
            str(file_path),
            document_id,
            file.filename
        )
        
        return DocumentUploadResponse(
            success=True,
            message="Document uploaded successfully and processing started",
            data={
                "document_id": document_id,
                "filename": file.filename,
                "status": "processing"
            }
        )
        
    except (InvalidFileTypeError, FileSizeExceededError):
        raise
    except Exception as e:
        raise FileUploadError(
            message="File upload failed",
            details=str(e)
        )

async def process_document_background(file_path: str, document_id: str, filename: str):
    """Background task to process uploaded document"""
    try:
        result = await knowledge_base_service.process_document(
            file_path=file_path,
            document_id=document_id
        )
        # In a real application, you'd update a database record here
        print(f"Document {document_id} processed successfully: {result}")
        
    except Exception as e:
        print(f"Document {document_id} processing failed: {str(e)}")
        # In a real application, you'd update the database with error status

@router.get("/documents/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(document_id: str):
    """Get processing status of an uploaded document"""
    try:
        status = await knowledge_base_service.get_document_status(document_id)
        
        return DocumentStatusResponse(
            success=True,
            message="Document status retrieved",
            data=status
        )
        
    except Exception as e:
        raise NotFoundError(
            message="Document not found",
            details=f"No document found with ID: {document_id}"
        )

@router.post("/workflows/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(request: WorkflowExecutionRequest):
    """Execute a complete RAG workflow"""
    try:
        if not request.query.strip():
            raise ValidationError(
                message="Query cannot be empty",
                details="Please provide a valid query"
            )
        
        if not request.workflow_definition:
            raise ValidationError(
                message="Workflow definition cannot be empty",
                details="Please provide a valid workflow definition"
            )
        
        # Execute the workflow
        result = await workflow_executor.execute_workflow(
            user_query=request.query,
            workflow_definition=request.workflow_definition,
            session_id=request.session_id
        )
        
        return WorkflowExecutionResponse(
            success=True,
            message="Workflow executed successfully",
            data=result
        )
        
    except ValidationError:
        raise
    except WorkflowExecutionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise WorkflowExecutionError(
            message="Workflow execution failed",
            details=str(e)
        )

@router.post("/embeddings", response_model=BaseResponse)
async def generate_embeddings(request: EmbeddingRequest):
    """Generate embeddings for text inputs"""
    try:
        if not request.texts or len(request.texts) == 0:
            raise ValidationError(
                message="Text list cannot be empty",
                details="Please provide at least one text for embedding"
            )
        
        embeddings = await openai_service.generate_embeddings(
            texts=request.texts,
            model=request.model
        )
        
        return BaseResponse(
            success=True,
            message="Embeddings generated successfully",
            data={"embeddings": embeddings}
        )
        
    except ValidationError:
        raise
    except EmbeddingError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/knowledge-base/search", response_model=BaseResponse)
async def search_knowledge_base(
    query: str,
    n_results: int = 5,
    document_ids: Optional[str] = None
):
    """Search the knowledge base for relevant context"""
    try:
        if not query.strip():
            raise ValidationError(
                message="Query cannot be empty",
                details="Please provide a search query"
            )
        
        # Parse document_ids if provided
        doc_ids = None
        if document_ids:
            doc_ids = [id.strip() for id in document_ids.split(",") if id.strip()]
        
        # Search knowledge base
        results = await knowledge_base_service.retrieve_relevant_context(
            query=query,
            n_results=n_results,
            document_ids=doc_ids
        )
        
        return BaseResponse(
            success=True,
            message="Knowledge base search completed",
            data={
                "query": query,
                "results": results,
                "total_results": len(results)
            }
        )
        
    except ValidationError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail="Knowledge base search failed"
        )

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document from the knowledge base"""
    try:
        success = knowledge_base_service.delete_document(document_id)
        
        if success:
            return BaseResponse(
                success=True,
                message="Document deleted successfully",
                data={"document_id": document_id}
            )
        else:
            raise NotFoundError(
                message="Document not found",
                details=f"No document found with ID: {document_id}"
            )
        
    except NotFoundError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete document"
        )

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return BaseResponse(
        success=True,
        message="RAG system is operational",
        data={
            "services": {
                "openai": bool(settings.OPENAI_API_KEY),
                "vector_db": True,  # Would check ChromaDB connection
                "file_upload": os.path.exists(settings.UPLOAD_DIR)
            }
        }
    )
