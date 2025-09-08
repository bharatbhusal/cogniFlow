from pydantic import BaseModel
from typing import List, Optional
from app.types.conversation import ConversationMessage

class LLMRequest(BaseModel):
    project_id: str
    user_id: str
    query: str
    conversation: List[ConversationMessage]
    context: List[str]     # text chunks from KB + web
    max_tokens: int = 512
    temperature: float = 0.7
    
class LLMResponse(BaseModel):
    message_id: str
    project_id: str
    role: str = "assistant"
    answer: str
    citations: Optional[List[str]] = None
    created_at: str