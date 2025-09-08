from sqlalchemy import (Column, String, DateTime, ForeignKey, Index, func)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.config.db import Base
from app.utils.cuid_str import cuid_str

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=cuid_str)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title = Column(String, nullable=False)
    embedding_metadata = Column(JSONB, nullable=True)
    status = Column(String, default="processing", index=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="documents")

    __table_args__ = (
        Index("ix_documents_embedding_metadata_gin", embedding_metadata, postgresql_using="gin"),
    )
