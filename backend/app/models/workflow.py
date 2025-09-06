from pydantic import BaseModel

class Workflow(BaseModel):
    id: int
    name: str
    description: str
