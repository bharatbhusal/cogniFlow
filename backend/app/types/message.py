from datetime import datetime
from pydantic import BaseModel
from typing_extensions import TypedDict


# Message Pydantic models
class MessageBase(BaseModel):
    content: str
    project_id: str
    role: str = "user"  # 'user' or 'assistant'


class MessageCreate(MessageBase):
    pass


class MessageUpdate(BaseModel):
    content: str


class MessageResponse(MessageBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class MessageCreateDict(TypedDict):
    content: str
    project_id: str
    role: str  # 'user' or 'assistant'
