from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime


class BaseResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    timestamp: datetime = datetime.now()


class ErrorResponse(BaseResponse):
    success: bool = False
    error_code: str
    details: Optional[str] = None


# Authentication & Authorization Errors
class AuthError(ErrorResponse):
    error_code: str = "AUTH_ERROR"


class UnauthorizedError(ErrorResponse):
    error_code: str = "UNAUTHORIZED"


class ForbiddenError(ErrorResponse):
    error_code: str = "FORBIDDEN"


class TokenExpiredError(ErrorResponse):
    error_code: str = "TOKEN_EXPIRED"


class InvalidTokenError(ErrorResponse):
    error_code: str = "INVALID_TOKEN"


# Validation & Request Errors
class ValidationError(ErrorResponse):
    error_code: str = "VALIDATION_ERROR"


class InvalidError(ErrorResponse):
    error_code: str = "INVALID_ERROR"


class BadRequestError(ErrorResponse):
    error_code: str = "BAD_REQUEST_ERROR"


class NotFoundError(ErrorResponse):
    error_code: str = "NOT_FOUND"


class ConflictError(ErrorResponse):
    error_code: str = "CONFLICT_ERROR"


# Database & Storage Errors
class DatabaseError(ErrorResponse):
    error_code: str = "DB_ERROR"


class ConnectionError(ErrorResponse):
    error_code: str = "CONNECTION_ERROR"


class DataIntegrityError(ErrorResponse):
    error_code: str = "DATA_INTEGRITY_ERROR"


# AI & ML Errors
class AIServiceError(ErrorResponse):
    error_code: str = "AI_SERVICE_ERROR"


class OpenAIError(ErrorResponse):
    error_code: str = "OPENAI_ERROR"


class EmbeddingError(ErrorResponse):
    error_code: str = "EMBEDDING_ERROR"


class ModelNotFoundError(ErrorResponse):
    error_code: str = "MODEL_NOT_FOUND"


class TokenLimitExceededError(ErrorResponse):
    error_code: str = "TOKEN_LIMIT_EXCEEDED"


class AIQuotaExceededError(ErrorResponse):
    error_code: str = "AI_QUOTA_EXCEEDED"


# RAG System Specific Errors
class RAGPipelineError(ErrorResponse):
    error_code: str = "RAG_PIPELINE_ERROR"


class DocumentProcessingError(ErrorResponse):
    error_code: str = "DOCUMENT_PROCESSING_ERROR"


class TextExtractionError(ErrorResponse):
    error_code: str = "TEXT_EXTRACTION_ERROR"


class ChunkingError(ErrorResponse):
    error_code: str = "CHUNKING_ERROR"


class RetrievalError(ErrorResponse):
    error_code: str = "RETRIEVAL_ERROR"


class VectorStoreError(ErrorResponse):
    error_code: str = "VECTOR_STORE_ERROR"


class ChromaDBError(ErrorResponse):
    error_code: str = "CHROMADB_ERROR"


class ContextRetrievalError(ErrorResponse):
    error_code: str = "CONTEXT_RETRIEVAL_ERROR"


class PromptAugmentationError(ErrorResponse):
    error_code: str = "PROMPT_AUGMENTATION_ERROR"


# Workflow & Processing Errors
class WorkflowError(ErrorResponse):
    error_code: str = "WORKFLOW_ERROR"


class WorkflowExecutionError(ErrorResponse):
    error_code: str = "WORKFLOW_EXECUTION_ERROR"


class WorkflowParsingError(ErrorResponse):
    error_code: str = "WORKFLOW_PARSING_ERROR"


class InvalidWorkflowError(ErrorResponse):
    error_code: str = "INVALID_WORKFLOW"


class ProcessingError(ErrorResponse):
    error_code: str = "PROCESSING_ERROR"


class TimeoutError(ErrorResponse):
    error_code: str = "TIMEOUT_ERROR"


class ResourceExhaustedError(ErrorResponse):
    error_code: str = "RESOURCE_EXHAUSTED"


# File & Upload Errors
class FileError(ErrorResponse):
    error_code: str = "FILE_ERROR"


class FileNotFoundError(ErrorResponse):
    error_code: str = "FILE_NOT_FOUND"


class FileUploadError(ErrorResponse):
    error_code: str = "FILE_UPLOAD_ERROR"


class FileSizeExceededError(ErrorResponse):
    error_code: str = "FILE_SIZE_EXCEEDED"


class InvalidFileTypeError(ErrorResponse):
    error_code: str = "INVALID_FILE_TYPE"


class PDFExtractionError(ErrorResponse):
    error_code: str = "PDF_EXTRACTION_ERROR"


# Knowledge Base Errors
class KnowledgeBaseError(ErrorResponse):
    error_code: str = "KNOWLEDGE_BASE_ERROR"


class DocumentNotFoundError(ErrorResponse):
    error_code: str = "DOCUMENT_NOT_FOUND"


class DocumentIngestionError(ErrorResponse):
    error_code: str = "DOCUMENT_INGESTION_ERROR"


class IndexingError(ErrorResponse):
    error_code: str = "INDEXING_ERROR"


# External Service Errors
class ExternalServiceError(ErrorResponse):
    error_code: str = "EXTERNAL_SERVICE_ERROR"


class APIKeyError(ErrorResponse):
    error_code: str = "API_KEY_ERROR"


class RateLimitError(ErrorResponse):
    error_code: str = "RATE_LIMIT_ERROR"


class ServiceUnavailableError(ErrorResponse):
    error_code: str = "SERVICE_UNAVAILABLE"


class WebSearchError(ErrorResponse):
    error_code: str = "WEB_SEARCH_ERROR"


class SerpAPIError(ErrorResponse):
    error_code: str = "SERPAPI_ERROR"


# System & Internal Errors
class InternalServerError(ErrorResponse):
    error_code: str = "INTERNAL_SERVER_ERROR"


class ConfigurationError(ErrorResponse):
    error_code: str = "CONFIGURATION_ERROR"


class PermissionError(ErrorResponse):
    error_code: str = "PERMISSION_ERROR"


# Response Models for RAG System
class DocumentUploadResponse(BaseResponse):
    data: Optional[dict] = None  # Contains document_id, filename, status


class WorkflowExecutionResponse(BaseResponse):
    data: Optional[dict] = (
        None  # Contains response_text, retrieved_sources, workflow_id
    )


class DocumentStatusResponse(BaseResponse):
    data: Optional[dict] = None  # Contains status, processing_progress, error_details
