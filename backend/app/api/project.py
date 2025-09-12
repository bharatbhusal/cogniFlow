from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends, status
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.message import MessageRepository
from app.services.project_service import ProjectService
from app.services.workflow_executor import workflow_executor
from app.types.query import QueryRequest
from app.types.user import AuthJWTTokenDict
from app.middlewares.auth_middleware import get_current_user
from app.config.db import get_db
from app.utils.responses import create_success_response, create_error_response
from app.services.knowledge_base import KnowledgeBaseService
from app.services.llm_service import LLMService
from app.utils.logger import log

router = APIRouter()


@router.post("")
async def create_project(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    pdf_files: Optional[List[UploadFile]] = File(None),
    workflow: Optional[str] = Form(None),
    kb_node_config: Optional[str] = Form(None),
    llm_node_config: Optional[str] = Form(None),
    web_search_node_config: Optional[str] = Form(None),
    user: AuthJWTTokenDict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new project with optional PDF file uploads

    Args:
        name: Project name (required)
        description: Project description (optional)
        pdf_files: List of PDF files to upload (optional)
    """
    try:
        # Validate that at least one PDF is provided if files are uploaded
        if pdf_files and len(pdf_files) == 0:
            return create_error_response(
                message="If uploading files, at least one PDF file is required",
                error_code="VALIDATION_ERROR",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        result = await ProjectService.create_project(
            db=db,
            name=name,
            user_id=user["id"],
            description=description,
            pdf_files=pdf_files,
            workflow=workflow,
            kb_node_config=kb_node_config,
            llm_node_config=llm_node_config,
            web_search_node_config=web_search_node_config,
        )

        # # Get ChromaDB chunk IDs for the project
        # chromadb_chunk_ids = await DocumentRepository.get_project_chromadb_chunk_ids(db, result["project_id"])

        # if not chromadb_chunk_ids:
        #     return create_error_response(
        #         message="No documents found in this project",
        #         error_code="NO_DOCUMENTS_FOUND",
        #         status_code=status.HTTP_404_NOT_FOUND
        #     )
        # llm_response = await llm_service.generate_chat_completion([{"role": "system", "content": "You are expert in summarizing the given chunks. Generate a meaningful summary/gist for the following chunks."},{"role": "user", "content": "Summarize this content please. Give me a paragraph with the gist followed by important points in bullet format."}])
        # # Save assistant response as a message
        # assistant_message  = {
        #     "project_id": result["project_id"],
        #     "content": llm_response["content"],
        #     "role": "assistant"
        # }
        # await MessageRepository.create(db, assistant_message)

        return create_success_response(
            message="Project created successfully",
            data=result,
            status_code=status.HTTP_201_CREATED,
        )

    except HTTPException as e:
        return create_error_response(
            message=e.detail,
            error_code="PROJECT_CREATION_ERROR",
            status_code=e.status_code,
        )
    except Exception as e:
        return create_error_response(
            message="Failed to create project",
            error_code="INTERNAL_SERVER_ERROR",
            details=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/")
async def list_projects(
    user: AuthJWTTokenDict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all projects for the authenticated user
    """
    try:
        projects = await ProjectService.get_user_projects(db, user["id"])
        return create_success_response(
            message="Projects retrieved successfully",
            data={"projects": projects, "total_count": len(projects)},
        )
    except HTTPException as e:
        return create_error_response(
            message=e.detail,
            error_code="PROJECT_RETRIEVAL_ERROR",
            status_code=e.status_code,
        )
    except Exception as e:
        return create_error_response(
            message="Failed to retrieve projects",
            error_code="INTERNAL_SERVER_ERROR",
            details=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    user: AuthJWTTokenDict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed information about a specific project
    """
    try:
        project_details = await ProjectService.get_project_details(
            db=db, project_id=project_id, user_id=user["id"]
        )

        return create_success_response(
            message="Project details retrieved successfully", data=project_details
        )

    except HTTPException as e:
        return create_error_response(
            message=e.detail,
            error_code=(
                "PROJECT_NOT_FOUND" if e.status_code == 404 else "PROJECT_ACCESS_ERROR"
            ),
            status_code=e.status_code,
        )
    except Exception as e:
        return create_error_response(
            message="Failed to retrieve project details",
            error_code="INTERNAL_SERVER_ERROR",
            details=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.put("/{project_id}")
async def update_project(
    project_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    pdf_files: Optional[List[UploadFile]] = File(None),
    delete_documents: Optional[str] = Form(None),  # Comma-separated document IDs
    workflow: Optional[str] = Form(None),
    kb_node_config: Optional[str] = Form(None),
    llm_node_config: Optional[str] = Form(None),
    web_search_node_config: Optional[str] = Form(None),
    user: AuthJWTTokenDict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update project details, add new documents, or delete existing documents

    Args:
        project_id: ID of the project to update
        name: New project name (optional)
        description: New project description (optional)
        pdf_files: New PDF files to add (optional)
        delete_documents: Comma-separated list of document IDs to delete (optional)
    """
    try:
        # Parse delete_documents string into list
        delete_document_ids = None
        if delete_documents:
            delete_document_ids = [
                doc_id.strip()
                for doc_id in delete_documents.split(",")
                if doc_id.strip()
            ]

        # Validate that at least one update operation is requested
        if not any(
            [name is not None, description is not None, pdf_files, delete_document_ids, workflow, kb_node_config, llm_node_config, web_search_node_config]
        ):
            return create_error_response(
                message="At least one update operation must be specified",
                error_code="VALIDATION_ERROR",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        result = await ProjectService.update_project(
            db=db,
            project_id=project_id,
            user_id=user["id"],
            name=name,
            description=description,
            pdf_files=pdf_files,
            delete_document_ids=delete_document_ids,
            workflow=workflow,
            kb_node_config=kb_node_config,
            llm_node_config=llm_node_config,
            web_search_node_config=web_search_node_config,
        )

        return create_success_response(
            message="Project updated successfully", data=result
        )

    except HTTPException as e:
        return create_error_response(
            message=e.detail,
            error_code="PROJECT_UPDATE_ERROR",
            status_code=e.status_code,
        )
    except Exception as e:
        return create_error_response(
            message="Failed to update project",
            error_code="INTERNAL_SERVER_ERROR",
            details=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    user: AuthJWTTokenDict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a project and all its associated documents
    """
    try:
        result = await ProjectService.delete_project(
            db=db, project_id=project_id, user_id=user["id"]
        )

        return create_success_response(
            message="Project deleted successfully", data=result
        )

    except HTTPException as e:
        return create_error_response(
            message=e.detail,
            error_code="PROJECT_DELETION_ERROR",
            status_code=e.status_code,
        )
    except Exception as e:
        return create_error_response(
            message="Failed to delete project",
            error_code="INTERNAL_SERVER_ERROR",
            details=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post("/{project_id}/query")
async def query_project(
    project_id: str,
    request: QueryRequest,
    user: AuthJWTTokenDict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Query documents within a specific project using semantic search with conversation history

    Args:
        project_id: ID of the project to query
        request: JSON request body containing query
    """
    query = request.query
    try:
        # Verify user has access to the project and get workflow config
        project_config = await ProjectService.get_project_workflow_config(db, project_id, user["id"])
        project_details = await ProjectService.get_project_details(db, project_id, user["id"])

        log("Project Config", project_config)

        # Get workflow definition from project config
        workflow_def = project_config.get("workflow_definition")
        
        log("Workflow", workflow_def)
        
        previous_messages = project_details["messages"][::-1]
        conversation_history = []
        
        log("Previous Messages", previous_messages)
        
        # Take last 10 messages and reverse to chronological order
        for msg in previous_messages[:10]:
            conversation_history.append({"role": msg["role"], "content": msg["content"]})

        # Save user query as a message
        user_message = {"project_id": project_id, "content": query, "role": "user"}
        
        log("User Message", user_message)

        await MessageRepository.create(db, user_message)

        # Execute workflow based on project's workflow definition
        workflow_def = project_config.get("workflow_definition")
        if workflow_def:
            try:
                log(f"Executing workflow: {workflow_def}")
                
                # Execute the workflow using the workflow executor
                workflow_result = await workflow_executor.execute_workflow(
                    user_query=query,
                    workflow_definition=workflow_def,
                    project_config=project_config,
                    conversation_history=conversation_history
                )
                
                assistant_response = workflow_result["response_text"]
                execution_log = workflow_result["execution_log"]
                sources = workflow_result["retrieved_sources"]
                
                log("Workflow execution successful", {
                    "workflow": workflow_def,
                    "execution_log": execution_log,
                    "sources_count": len(sources),
                    "response_length": len(assistant_response)
                })
                
            except Exception as workflow_error:
                log("Workflow execution failed", {
                    "workflow": workflow_def,
                    "error": str(workflow_error),
                    "error_type": type(workflow_error).__name__
                })
                assistant_response = f"I encountered an error while processing your request using the {workflow_def} workflow. Please try again or contact support if the issue persists."
        else:
            log("No workflow defined - using fallback RAG pipeline")
            # Fallback: No workflow defined
            chromadb_chunk_ids = project_config.get("chromadb_chunk_ids", [])
            if chromadb_chunk_ids:
                # Get API keys from project config for fallback
                kb_config = project_config.get("knowledge_base_node", {})
                llm_config = project_config.get("llm_node", {})
                
                kb_api_key = kb_config.get("openai_api_key")
                embedding_model = kb_config.get("embedding_model_name")
                llm_api_key = llm_config.get("openai_api_key")
                llm_model = llm_config.get("llm_model_name")
                
                # Create service instances with user-provided credentials
                if not (kb_api_key and embedding_model):
                    return create_error_response("Knowledge Base service not configured with API key and model", 400)
                if not (llm_api_key and llm_model):
                    return create_error_response("LLM service not configured with API key and model", 400)
                
                kb_service_instance = KnowledgeBaseService(api_key=kb_api_key, model=embedding_model)
                llm_service_instance = LLMService(api_key=llm_api_key, model=llm_model)
                
                # Use simple RAG pipeline as fallback
                context_chunks = await kb_service_instance.retrieve_relevant_context_by_ids(
                    query=query, 
                    chromadb_chunk_ids=chromadb_chunk_ids,
                )
                retrieved_context = [each["text"] for each in context_chunks]

                llm_response = await llm_service_instance.run_rag_pipeline(
                    user_query=query,
                    retrieved_context=retrieved_context,
                    conversation_history=conversation_history,
                )
                assistant_response = llm_response["response_text"]
                log("Fallback RAG pipeline executed successfully")
            else:
                assistant_response = "I'm sorry, I don't have any documents in this project to answer your question. Please add some documents and configure a workflow to get started."
                log("No documents or workflow available")

        # Save assistant response as a message
        assistant_message = {
            "project_id": project_id,
            "content": assistant_response,
            "role": "assistant",
        }
        
        created_message = await MessageRepository.create(db, assistant_message)

        return create_success_response(
            message="Query executed successfully",
            data={
                "query": query,
                "project_id": project_id,
                "response": {
                    "id": created_message.id, 
                    "content": created_message.content, 
                    "created_at": created_message.created_at.isoformat(), 
                    "role": created_message.role
                },
                "conversation_history_included": len(conversation_history) > 0,
                "workflow_used": workflow_def,
            },
        )

    except HTTPException as e:
        return create_error_response(
            message=e.detail,
            error_code="PROJECT_QUERY_ERROR",
            status_code=e.status_code,
        )
    except Exception as e:
        return create_error_response(
            message="Failed to query project",
            error_code="INTERNAL_SERVER_ERROR",
            details=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
