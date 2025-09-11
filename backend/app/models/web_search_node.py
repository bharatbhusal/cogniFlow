from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.db import Base
from app.utils.cuid_str import cuid_str

class WebSearchNode(Base):
    __tablename__ = "web_search_nodes"
    id = Column(String, primary_key=True, default=cuid_str)
    project_id = Column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), index=True, unique=True
    )
    serpapi_api_key = Column(String, nullable=False)

    project = relationship("Project", back_populates="web_search_node")
