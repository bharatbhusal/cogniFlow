from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func, Index
from sqlalchemy.orm import relationship
from app.config.db import Base
from app.utils.cuid_str import cuid_str


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=cuid_str)
    name = Column(String, nullable=False, index=True)
    owner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="projects")
    documents = relationship(
        "Document", back_populates="project", cascade="all, delete-orphan"
    )
    messages = relationship(
        "Message", back_populates="project", cascade="all, delete-orphan"
    )
    workflow_node = relationship("WorkflowNode", back_populates="project", uselist=False)
    knowledge_base_node = relationship("KnowledgeBaseNode", back_populates="project", uselist=False)
    llm_node = relationship("LlmNode", back_populates="project", uselist=False)
    web_search_node = relationship("WebSearchNode", back_populates="project", uselist=False)
