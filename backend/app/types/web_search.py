from pydantic import BaseModel
from typing import List
from app.types.conversation import ConversationMessage


class WebSearchRequest(BaseModel):
    query: str
    conversation: List[ConversationMessage]
    num_results: int = 5
