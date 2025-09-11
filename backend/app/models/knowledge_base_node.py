from sqlalchemy import Column, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.db import Base
from app.utils.cuid_str import cuid_str

class KnowledgeBaseNode(Base):
    __tablename__ = "knowledge_base_nodes"
    id = Column(String, primary_key=True, default=cuid_str)
    project_id = Column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), index=True, unique=True
    )
    openai_api_key = Column(String, nullable=False)
    embedding_model_name = Column(String, nullable=False)

    project = relationship("Project", back_populates="knowledge_base_node")
