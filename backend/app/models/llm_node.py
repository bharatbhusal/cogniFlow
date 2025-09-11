from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.config.db import Base
from app.utils.cuid_str import cuid_str

class LlmNode(Base):
    __tablename__ = "llm_nodes"
    id = Column(String, primary_key=True, default=cuid_str)
    project_id = Column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), index=True, unique=True
    )
    openai_api_key = Column(String, nullable=False)
    llm_model_name = Column(String, nullable=False)

    project = relationship("Project", back_populates="llm_node")
