from datetime import datetime
from typing import Optional
from pydantic import BaseModel

# Document Pydantic models
class DocumentBase(BaseModel):
    title: str
    project_id: int

class Metadata(BaseModel):
    id_in_chroma: str
    size: int
    type: str

class DocumentCreate(DocumentBase):
    embedding_metadata: Metadata
    status: Optional[str] = "processing"

class DocumentUpdate(BaseModel):
    title: str
    status: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
