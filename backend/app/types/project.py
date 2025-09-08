from datetime import datetime
from typing import Optional
from pydantic import BaseModel

# Project Pydantic models
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
