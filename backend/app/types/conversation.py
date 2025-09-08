from pydantic import BaseModel
from typing import List

class ConversationMessage(BaseModel):
    id: str
    role: str   # "user" or "assistant"
    content: str
    created_at: str


class ConversationContextResponse(BaseModel):
    project_id: str
    messages: List[ConversationMessage]