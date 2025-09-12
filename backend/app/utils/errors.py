from typing import Optional


# Base Custom Exception
class BaseCustomError(Exception):
    def __init__(self, message: str, details: Optional[str] = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


# Authentication & Authorization Errors
class AuthError(BaseCustomError):
    pass


class UnauthorizedError(BaseCustomError):
    pass


class ForbiddenError(BaseCustomError):
    pass


class TokenExpiredError(BaseCustomError):
    pass


class InvalidTokenError(BaseCustomError):
    pass


# Validation & Request Errors
class ValidationError(BaseCustomError):
    pass


class InvalidError(BaseCustomError):
    pass


class BadRequestError(BaseCustomError):
    pass


class NotFoundError(BaseCustomError):
    pass


class ConflictError(BaseCustomError):
    pass


# Database & Storage Errors
class DatabaseError(BaseCustomError):
    pass


class ConnectionError(BaseCustomError):
    pass


class DataIntegrityError(BaseCustomError):
    pass


# AI & ML Errors
class AIServiceError(BaseCustomError):
    pass


class OpenAIError(BaseCustomError):
    pass


class EmbeddingError(BaseCustomError):
    pass


class ModelNotFoundError(BaseCustomError):
    pass


class TokenLimitExceededError(BaseCustomError):
    pass


class AIQuotaExceededError(BaseCustomError):
    pass


# RAG System Specific Errors
class RAGPipelineError(BaseCustomError):
    pass


class DocumentProcessingError(BaseCustomError):
    pass


class TextExtractionError(BaseCustomError):
    pass


class ChunkingError(BaseCustomError):
    pass


class RetrievalError(BaseCustomError):
    pass


class VectorStoreError(BaseCustomError):
    pass


class ChromaDBError(BaseCustomError):
    pass


class ContextRetrievalError(BaseCustomError):
    pass


class PromptAugmentationError(BaseCustomError):
    pass


# Workflow & Processing Errors
class WorkflowError(BaseCustomError):
    pass


class WorkflowExecutionError(BaseCustomError):
    pass


class WorkflowParsingError(BaseCustomError):
    pass


class InvalidWorkflowError(BaseCustomError):
    pass


class ProcessingError(BaseCustomError):
    pass


class TimeoutError(BaseCustomError):
    pass


class ResourceExhaustedError(BaseCustomError):
    pass


# File & Upload Errors
class FileError(BaseCustomError):
    pass


class FileNotFoundError(BaseCustomError):
    pass


class FileUploadError(BaseCustomError):
    pass


class FileSizeExceededError(BaseCustomError):
    pass


class InvalidFileTypeError(BaseCustomError):
    pass


class PDFExtractionError(BaseCustomError):
    pass


# Knowledge Base Errors
class KnowledgeBaseError(BaseCustomError):
    pass


class DocumentNotFoundError(BaseCustomError):
    pass


class DocumentIngestionError(BaseCustomError):
    pass


class IndexingError(BaseCustomError):
    pass


# External Service Errors
class ExternalServiceError(BaseCustomError):
    pass


class APIKeyError(BaseCustomError):
    pass


class RateLimitError(BaseCustomError):
    pass


class ServiceUnavailableError(BaseCustomError):
    pass


class WebSearchError(BaseCustomError):
    pass


class SerpAPIError(BaseCustomError):
    pass


# System & Internal Errors
class InternalServerError(BaseCustomError):
    pass


class ConfigurationError(BaseCustomError):
    pass


class PermissionError(BaseCustomError):
    pass
