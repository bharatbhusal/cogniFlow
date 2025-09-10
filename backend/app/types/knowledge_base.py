from pydantic import BaseModel
from typing import Dict, List

from app.types.conversation import ConversationMessage


class KnowledgeBaseRequest(BaseModel):
    project_id: str
    query: str
    conversation: List[ConversationMessage]
    top_k: int = 5


class KnowledgeBaseHit(BaseModel):
    document_id: str
    content_snippet: str
    score: float
    metadata: Dict


class KnowledgeBaseResponse(BaseModel):
    query: str
    hits: List[KnowledgeBaseHit]
