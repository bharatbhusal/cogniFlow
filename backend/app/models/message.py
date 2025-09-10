from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Index, func
from sqlalchemy.orm import relationship
from app.config.db import Base
from app.utils.cuid_str import cuid_str


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=cuid_str)
    project_id = Column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    content = Column(Text, nullable=False)
    role = Column(String, nullable=False, default="user")  # 'user' or 'assistant'
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    # Relationships
    project = relationship("Project", back_populates="messages")

    __table_args__ = (Index("ix_messages_project_created", "project_id", "created_at"),)
