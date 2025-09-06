from pydantic import BaseModel

class Task(BaseModel):
    id: int
    workflow_id: int
    name: str
    status: str
