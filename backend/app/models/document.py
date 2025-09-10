from sqlalchemy import Column, String, DateTime, ForeignKey, Index, func, Integer
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from app.config.db import Base
from app.utils.cuid_str import cuid_str


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=cuid_str)
    project_id = Column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    title = Column(String, nullable=False)
    content_hash = Column(String, nullable=True, index=True)
    pages = Column(Integer, nullable=False, default=0)
    total_chunks = Column(Integer, nullable=False, default=0)
    
    file_url = Column(String, nullable=True)

    # Store ChromaDB chunk IDs as PostgreSQL array
    chroma_chunk_ids = Column(ARRAY(String), nullable=True)

    # Legacy field for backward compatibility
    chroma_document_id = Column(String, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="documents")

    # Add index for better query performance
    __table_args__ = (Index("ix_document_project_hash", project_id, content_hash),)
