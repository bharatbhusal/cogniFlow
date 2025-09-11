from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.db import Base
from app.utils.cuid_str import cuid_str

class WorkflowNode(Base):
    __tablename__ = "workflow_nodes"
    id = Column(String, primary_key=True, default=cuid_str)
    project_id = Column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), index=True, unique=True
    )
    definition = Column(String, nullable=False)

    project = relationship("Project", back_populates="workflow_node")