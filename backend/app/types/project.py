from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from typing_extensions import TypedDict

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
class ProjectCreateDict(TypedDict):
    name: str
    description: Optional[str] = ""
    owner_id: str
    
class ProjectUpdateDict(TypedDict):
    name: Optional[str]
    description: Optional[str]