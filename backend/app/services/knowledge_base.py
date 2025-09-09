import os
import uuid
from typing import List, Optional, Dict, Any
from pathlib import Path
import fitz as PyMuPDF 
import chromadb
from chromadb.config import Settings
from io import BytesIO
from app.config.env import get_settings
from app.services.openai_service import openai_service
from app.types.responses import (
    DocumentProcessingError,
    TextExtractionError,
    ChunkingError,
    VectorStoreError,
    ChromaDBError,
    DocumentIngestionError,
    RetrievalError,
    ContextRetrievalError
)

settings = get_settings()

class KnowledgeBaseService:
    def __init__(self):
        # Initialize ChromaDB client
        try:
            # Use persistent client with configured directory
            self.chroma_client = chromadb.PersistentClient(
                path=settings.CHROMADB_PERSIST_DIRECTORY
            )
            self.collection_name = settings.CHROMADB_COLLECTION_NAME
            self.collection = self._get_or_create_collection()
        except Exception as e:
            raise ChromaDBError(
                message="Failed to initialize ChromaDB",
                details=str(e)
            )
    
    def _get_or_create_collection(self):
        """Get or create the main documents collection"""
        try:
            return self.chroma_client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "Document chunks for RAG system"}
            )
        except Exception as e:
            raise ChromaDBError(
                message="Failed to create/access ChromaDB collection",
                details=str(e)
            )
    
    async def process_document_from_memory(
        self,
        content: bytes,
        filename: str,
        document_id: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> Dict[str, Any]:
        """Process a PDF document from memory content"""
        try:
            # Extract text from PDF content
            text_content, pages = await self.extract_text_from_pdf_memory(content)
            
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
            embeddings = await openai_service.generate_embeddings(chunks)
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
            raise DocumentIngestionError(
                message="Document ingestion failed",
                details=f"Error processing document {filename}: {str(e)}"
            )
    
    async def process_document(
        self,
        file_path: str,
        document_id: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> Dict[str, Any]:
        """Process a document from file path (legacy method)"""
        try:
            # Extract text from PDF
            text_content = await self.extract_text_from_pdf(file_path)
            
            # Chunk the text
            chunks = self.chunk_text_recursively(
                text_content, 
                chunk_size=chunk_size, 
                chunk_overlap=chunk_overlap
            )
            
            # Generate embeddings for chunks
            embeddings = await openai_service.generate_embeddings(chunks)
            
            # Store in vector database
            chunk_ids = await self.store_chunks_in_vectordb(
                chunks=chunks,
                embeddings=embeddings,
                document_id=document_id,
                metadata={"file_path": file_path}
            )
            
            return {
                "document_id": document_id,
                "total_chunks": len(chunks),
                "chunk_ids": chunk_ids,
                "status": "completed"
            }
            
        except Exception as e:
            raise DocumentIngestionError(
                message="Document ingestion failed",
                details=f"Error processing document {document_id}: {str(e)}"
            )
    
    async def extract_text_from_pdf_memory(self, content: bytes) -> tuple[str, int]:
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
    
    async def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text content from PDF using PyMuPDF (legacy method)"""
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            # Open PDF document
            doc = PyMuPDF.open(file_path)
            text_content = ""
            
            # Extract text from each page
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text_content += page.get_text() + "\n\n"
            
            doc.close()
            
            if not text_content.strip():
                raise TextExtractionError(
                    message="No text content extracted from PDF",
                    details="The PDF may be image-based or corrupted"
                )
            
            return text_content.strip()
            
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
            query_embedding = await openai_service.generate_single_embedding(query)
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

# Singleton instance
knowledge_base_service = KnowledgeBaseService()
