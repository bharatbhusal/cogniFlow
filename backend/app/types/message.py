from datetime import datetime
from typing import Optional
from pydantic import BaseModel

# Message Pydantic models
class MessageBase(BaseModel):
    content: str
    project_id: int


class MessageUpdate(BaseModel):
    content: str

class MessageResponse(MessageBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True