import uuid
from typing import List, Optional, Dict, Any
import fitz as PyMuPDF 
import chromadb
from openai import AsyncOpenAI
from app.config.env import get_settings
from app.utils.errors import (
    DocumentProcessingError,
    TextExtractionError,
    ChunkingError,
    VectorStoreError,
    ChromaDBError,
    DocumentIngestionError,
    RetrievalError,
    ContextRetrievalError,
    EmbeddingError,
    AIQuotaExceededError,
    OpenAIError,
)
from app.utils.logger import log

settings = get_settings()

class KnowledgeBaseService:
    """
    Knowledge Base service with ChromaDB Cloud integration and dynamic embedding model support.
    
    Features:
    - ChromaDB Cloud integration for scalable vector storage
    - Supports any OpenAI embedding model with automatic dimension handling
    - Model-specific collection naming to prevent dimension conflicts
    - Comprehensive error handling and validation
    - Maintains backward compatibility with existing OpenAI functions
    
    Model Support:
    - Any OpenAI embedding model (text-embedding-3-small, text-embedding-3-large, etc.)
    - Automatic dimension detection and handling
    - Each model gets its own collection to avoid dimension conflicts
    
    Usage:
    - Collections are named: {CHROMADB_COLLECTION_NAME}_{model_name_with_underscores}
    - Example: "documents_text_embedding_3_large" for text-embedding-3-large model
    - Use list_available_collections() to see all existing collections
    """
    def __init__(self, api_key: str, model: str, vector_collection: str):
        """Initialize Knowledge Base service with required API key and embedding model"""
        if not api_key:
            raise ValueError("OpenAI API key is required")
        if not model:
            raise ValueError("Embedding model is required")
           
        self.api_key = api_key
        self.model = model
        
        # Initialize ChromaDB cloud client
        try:
            self.chroma_client = chromadb.CloudClient(
                api_key=settings.CHROMADB_API_KEY,
                tenant=settings.CHROMADB_TENANT,
                database=settings.CHROMADB_DATABASE
            )
            
            # Test the connection
            self.chroma_client.heartbeat()
            
            # Create model-specific collection name to handle different embedding dimensions
            self.collection_name = vector_collection
            self.collection = self._get_or_create_collection()
        except Exception as e:
            error_msg = str(e).lower()
            if "unauthorized" in error_msg or "api key" in error_msg:
                raise ChromaDBError(
                    message="ChromaDB Cloud authentication failed",
                    details="Please check your ChromaDB API key, tenant, and database settings."
                )
            elif "network" in error_msg or "connection" in error_msg:
                raise ChromaDBError(
                    message="Failed to connect to ChromaDB Cloud",
                    details="Please check your network connection and ChromaDB Cloud service status."
                )
            else:
                raise ChromaDBError(
                    message="Failed to initialize ChromaDB Cloud",
                    details=str(e)
                )
        
        # Initialize OpenAI client for embeddings
        self.openai_client = AsyncOpenAI(api_key=api_key)

    async def validate_api_key_and_model(self) -> Dict[str, Any]:
        """Validate the API key and model asynchronously"""
        return  self._is_embedding_model(self.model) and await self._validate_api_key()

    def _is_embedding_model(self, model: str) -> bool:
        """
        Check if the given model is a valid embedding model.
        
        Args:
            model: The model name to check
            
        Returns:
            bool: True if model is an embedding model, False otherwise
        """
        # Supported embedding models
        embedding_models = {
            # Current embedding models
            "text-embedding-3-small",
            "text-embedding-3-large", 
            "text-embedding-ada-002",
        }
        if model in embedding_models:
            return True
        else:
            raise OpenAIError(
                message="Invalid embedding model",
                details=f"Model '{model}' is not a recognized embedding model"
            )
        
    async def _validate_api_key(self) -> Dict[str, Any]:
        """
        Validate OpenAI API key and embedding model by calling OpenAI API.
        
        Args:
            api_key: OpenAI API key to validate
            model: Embedding model name to validate
            
        Returns:
            Dict containing validation results
            
        Raises:
            OpenAIError: If API key is invalid
            ModelNotFoundError: If model doesn't exist or isn't accessible
            ValueError: If model is not an embedding model
        """
        try:
            return True if  await self.openai_client.models.retrieve(self.model) else False
        except Exception as e:
            # Unexpected error
            raise OpenAIError(
                message="Invalid OpenAI API key",
                details=f"Error validating OpenAI API key: {str(e)}"
            )
        
    async def generate_embeddings(
        self,
        texts: List[str],
    ) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        try:
            # Clean and prepare texts
            cleaned_texts = [
                str(text).replace("\n", " ").strip()
                for text in texts
                if text and str(text).strip()
            ]

            if not cleaned_texts:
                raise EmbeddingError(
                    message="No valid texts provided for embedding",
                    details="All provided texts were empty or invalid",
                )
            
            response = await self.openai_client.embeddings.create(
                model=self.model, input=cleaned_texts
            )

            return [embedding.embedding for embedding in response.data]

        except Exception as e:
            if "quota" in str(e).lower():
                raise AIQuotaExceededError(
                    message="OpenAI embedding quota exceeded", details=str(e)
                )
            else:
                raise EmbeddingError(
                    message="Embedding generation failed", details=str(e)
                )

    async def generate_single_embedding(
        self,
        text: str,
    ) -> List[float]:
        """Generate embedding for a single text"""
        embeddings = await self.generate_embeddings([text])
        return embeddings[0]
    
    def _get_or_create_collection(self):
        """Get or create the main documents collection with model-specific naming"""
        try:
            return self.chroma_client.get_or_create_collection(
                name=self.collection_name,
                metadata={
                    "description": "Document chunks for RAG system",
                    "embedding_model": self.model,
                    "supports_dynamic_dimensions": True
                }
            )
        except Exception as e:
            raise ChromaDBError(
                message="Failed to create/access ChromaDB collection",
                details=str(e)
            )
    
    async def process_document(
        self,
        content: bytes,
        filename: str,
        document_id: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
    ) -> Dict[str, Any]:
        """Process a PDF document from memory content"""
        try:
            # Extract text from PDF content
            text_content, pages = await self.extract_text(content)
            # Chunk the text
            chunks = self.chunk_text_recursively(
                text_content, 
                chunk_size=chunk_size, 
                chunk_overlap=chunk_overlap
            )
            
            if not chunks:
                raise DocumentProcessingError(
                    message="No text chunks generated from document",
                    details=f"Document {filename} produced no processable content"
                )
            
            # Generate embeddings for chunks
            embeddings = await self.generate_embeddings(chunks)
            # Store in vector database
            chunk_ids = await self.store_chunks_in_vectordb(
                chunks=chunks,
                embeddings=embeddings,
                document_id=document_id,
                metadata={
                    "filename": filename,
                    "pages": pages,
                    "processing_timestamp": str(uuid.uuid4())
                }
            )
            
            return {
                "document_id": document_id,
                "filename": filename,
                "pages": pages,
                "total_chunks": len(chunks),
                "chunk_ids": chunk_ids,
                "status": "completed"
            }
            
        except Exception as e:
            log("Process Document Error", e)
            raise DocumentIngestionError(
                message="Document ingestion failed",
                details=f"Error processing document {filename}: {str(e)}"
            )
    
    async def extract_text(self, content: bytes) -> tuple[str, int]:
        """Extract text content from PDF bytes using PyMuPDF"""
        try:
            # Open PDF from memory
            pdf_document = PyMuPDF.open(stream=content, filetype="pdf")
            text_content = ""
            pages = pdf_document.page_count
            
            # Extract text from each page
            for page_num in range(pages):
                page = pdf_document.load_page(page_num)
                page_text = page.get_text()
                if page_text.strip():
                    text_content += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
            
            pdf_document.close()
            
            if not text_content.strip():
                raise TextExtractionError(
                    message="No text content extracted from PDF",
                    details="The PDF may be image-based or corrupted"
                )
            
            return text_content.strip(), pages
            
        except Exception as e:
            if isinstance(e, TextExtractionError):
                raise
            raise TextExtractionError(
                message="Failed to extract text from PDF",
                details=str(e)
            )
    
    def chunk_text_recursively(
        self,
        text: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: Optional[List[str]] = None
    ) -> List[str]:
        """Recursively chunk text along semantic boundaries"""
        try:
            if separators is None:
                separators = ["\n\n", "\n", ". ", " ", ""]
            
            chunks = []
            
            def _split_text(text: str, separators: List[str], chunk_size: int) -> List[str]:
                if len(text) <= chunk_size:
                    return [text] if text.strip() else []
                
                if not separators:
                    # Fallback: split by character count
                    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size - chunk_overlap)]
                
                separator = separators[0]
                remaining_separators = separators[1:]
                
                splits = text.split(separator)
                current_chunk = ""
                result_chunks = []
                
                for split in splits:
                    # Add separator back except for empty string separator
                    if separator and split != splits[-1]:
                        split += separator
                    
                    if len(current_chunk + split) <= chunk_size:
                        current_chunk += split
                    else:
                        if current_chunk:
                            result_chunks.append(current_chunk.strip())
                        
                        # If single split is too large, recursively split it
                        if len(split) > chunk_size:
                            result_chunks.extend(_split_text(split, remaining_separators, chunk_size))
                        else:
                            current_chunk = split
                
                if current_chunk.strip():
                    result_chunks.append(current_chunk.strip())
                
                return result_chunks
            
            chunks = _split_text(text, separators, chunk_size)
            
            # Apply overlap logic
            if chunk_overlap > 0 and len(chunks) > 1:
                overlapped_chunks = []
                for i, chunk in enumerate(chunks):
                    if i == 0:
                        overlapped_chunks.append(chunk)
                    else:
                        # Add overlap from previous chunk
                        prev_chunk = chunks[i-1]
                        overlap_text = prev_chunk[-chunk_overlap:] if len(prev_chunk) > chunk_overlap else prev_chunk
                        overlapped_chunks.append(overlap_text + " " + chunk)
                chunks = overlapped_chunks
            
            # Filter out very small chunks
            chunks = [chunk for chunk in chunks if len(chunk.strip()) > 50]
            
            return chunks
            
        except Exception as e:
            raise ChunkingError(
                message="Text chunking failed",
                details=str(e)
            )
    
    async def store_chunks_in_vectordb(
        self,
        chunks: List[str],
        embeddings: List[List[float]],
        document_id: str,
        metadata: Dict[str, Any]
    ) -> List[str]:
        """Store text chunks and embeddings in ChromaDB"""
        try:
            chunk_ids = []
            metadatas = []
            
            for i, chunk in enumerate(chunks):
                chunk_id = f"{document_id}_chunk_{i}"
                chunk_ids.append(chunk_id)
                
                chunk_metadata = {
                    "document_id": document_id,
                    "chunk_index": i,
                    "chunk_length": len(chunk),
                    **metadata
                }
                metadatas.append(chunk_metadata)
            
            # Add to ChromaDB collection
            self.collection.add(
                embeddings=embeddings,
                documents=chunks,
                metadatas=metadatas,
                ids=chunk_ids
            )
            
            return chunk_ids
            
        except Exception as e:
            error_message = str(e)
            
            # Provide more specific error messages for dimension mismatches
            if "dimension" in error_message.lower():
                # Log detailed information for debugging
                log("Store Chunks Error - Dimension Mismatch", {
                    "error": error_message,
                    "model": self.model,
                    "collection": self.collection_name,
                    "embeddings_shape": f"{len(embeddings)}x{len(embeddings[0]) if embeddings else 0}"
                })
                
                raise VectorStoreError(
                    message=f"Embedding dimension mismatch for model '{self.model}'",
                    details=f"The collection '{self.collection_name}' expects different embedding dimensions than what your model produces. You may need to use a different collection or model. Error: {error_message}"
                )
            
            log("Store Chunks Error", e)
            raise VectorStoreError(
                message="Failed to store chunks in vector database",
                details=str(e)
            )
    
    async def retrieve_relevant_context(
        self,
        query: str,
        n_results: int = 5,
        document_ids: List[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve most relevant text chunks for a query"""
        try:
            # Generate embedding for the query
            query_embedding = await self.generate_single_embedding(query)
            if not document_ids:
                raise ValueError("document_ids must be provided for context retrieval")
            # Prepare query filters
            where_filter = {"document_id": {"$in": document_ids}}
           
            
            # Query ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_filter,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results
            context_chunks = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    context_chunks.append({
                        "text": doc,
                        "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                        "similarity": 1 - results["distances"][0][i] if results["distances"] else 0,
                        "source": results["metadatas"][0][i].get("filename", "unknown") if results["metadatas"] else "unknown",
                        "document_id": results["metadatas"][0][i].get("document_id", "unknown") if results["metadatas"] else "unknown"
                    })
            
            return context_chunks
            
        except Exception as e:
            raise ContextRetrievalError(
                message="Failed to retrieve relevant context",
                details=str(e)
            )
    
    async def retrieve_relevant_context_by_ids(
        self,
        query: str,
        n_results: int = 5,
        chromadb_chunk_ids: List[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant context using specific ChromaDB chunk IDs"""
        try:
            # Generate embedding for the query
            query_embedding = await self.generate_single_embedding(query)
            
            # Query only specific chunk IDs if provided
            if chromadb_chunk_ids:
                # Query ChromaDB with specific IDs
                results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=n_results,
                    include=["documents", "metadatas", "distances", "embeddings"]
                )
                
                # Filter results to only include specified chunk IDs
                if results["ids"] and results["ids"][0]:
                    filtered_results = {"documents": [[]], "metadatas": [[]], "distances": [[]], "ids": [[]]}
                    for i, chunk_id in enumerate(results["ids"][0]):
                        if chunk_id in chromadb_chunk_ids:
                            filtered_results["documents"][0].append(results["documents"][0][i])
                            filtered_results["metadatas"][0].append(results["metadatas"][0][i] if results["metadatas"] else {})
                            filtered_results["distances"][0].append(results["distances"][0][i] if results["distances"] else 0)
                            filtered_results["ids"][0].append(chunk_id)
                    results = filtered_results
            else:
                # Regular query without ID filtering
                results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=n_results,
                    include=["documents", "metadatas", "distances"]
                )
            
            # Format results
            context_chunks = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    context_chunks.append({
                        "text": doc,
                        "similarity": 1 - results["distances"][0][i] if results["distances"] else 0,
                        "chunk_id": results["ids"][0][i] if results["ids"] else None,
                        "document_id": results["metadatas"][0][i].get("document_id", "unknown") if results["metadatas"] else "unknown"
                    })
            
            return context_chunks
            
        except Exception as e:
            raise ContextRetrievalError(
                message="Failed to retrieve relevant context by IDs",
                details=str(e)
            )

    async def get_project_status(self, project_id: str) -> Dict[str, Any]:
        """Get status of all documents in a project"""
        try:
            # Query ChromaDB for all chunks in this project
            results = self.collection.get(
                where={"project_id": project_id},
                include=["documents", "metadatas"]
            )
            
            if not results["documents"]:
                return {
                    "project_id": project_id,
                    "status": "not_found",
                    "total_documents": 0,
                    "total_chunks": 0,
                    "documents": []
                }
            
            # Group by document_id
            documents = {}
            for i, metadata in enumerate(results["metadatas"]):
                doc_id = metadata.get("document_id", "unknown")
                if doc_id not in documents:
                    documents[doc_id] = {
                        "document_id": doc_id,
                        "filename": metadata.get("filename", "unknown"),
                        "pages": metadata.get("pages", 0),
                        "chunks": 0
                    }
                documents[doc_id]["chunks"] += 1
            
            return {
                "project_id": project_id,
                "status": "completed",
                "total_documents": len(documents),
                "total_chunks": len(results["documents"]),
                "documents": list(documents.values())
            }
            
        except Exception as e:
            raise RetrievalError(
                message="Failed to get project status",
                details=str(e)
            )
    
    async def get_project_documents(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all document IDs and metadata for a project"""
        try:
            results = self.collection.get(
                where={"project_id": project_id},
                include=["metadatas"]
            )
            
            # Get unique documents
            documents = {}
            for metadata in results["metadatas"]:
                doc_id = metadata.get("document_id")
                if doc_id and doc_id not in documents:
                    documents[doc_id] = {
                        "document_id": doc_id,
                        "filename": metadata.get("filename", "unknown"),
                        "pages": metadata.get("pages", 0)
                    }
            
            return list(documents.values())
            
        except Exception as e:
            raise RetrievalError(
                message="Failed to get project documents",
                details=str(e)
            )
    
    async def get_document_status(self, document_id: str) -> Dict[str, Any]:
        """Get processing status of a document"""
        try:
            # Query ChromaDB for chunks of this document
            results = self.collection.get(
                where={"document_id": document_id},
                include=["documents", "metadatas"]
            )
            
            if not results["documents"]:
                return {
                    "document_id": document_id,
                    "status": "not_found",
                    "total_chunks": 0
                }
            
            return {
                "document_id": document_id,
                "status": "completed",
                "total_chunks": len(results["documents"]),
                "metadata": results["metadatas"][0] if results["metadatas"] else {}
            }
            
        except Exception as e:
            raise RetrievalError(
                message="Failed to get document status",
                details=str(e)
            )
    
    async def delete_project(self, project_id: str) -> bool:
        """Delete all documents and chunks for a project"""
        try:
            # Get all chunk IDs for this project
            results = self.collection.get(
                where={"project_id": project_id},
                include=["metadatas"]
            )
            
            if results["ids"]:
                self.collection.delete(ids=results["ids"])
                return True
            
            return False
            
        except Exception as e:
            raise VectorStoreError(
                message="Failed to delete project",
                details=str(e)
            )
    
    def delete_document(self, document_id: str) -> bool:
        """Delete all chunks of a document from vector store"""
        try:
            # Get all chunk IDs for this document
            results = self.collection.get(
                where={"document_id": document_id},
                include=["metadatas"]
            )
            print("\n\nChromaDB delete_document results:", results)  # Debugging line
            
            if results["ids"]:
                self.collection.delete(ids=results["ids"])
                return True
            
            return False
            
        except Exception as e:
            raise VectorStoreError(
                message="Failed to delete document",
                details=str(e)
            )
