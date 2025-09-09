from pydantic import BaseModel

class QueryRequest(BaseModel):
    query: str


class UserQueryResponse(BaseModel):
    message_id: str
    project_id: str
    user_id: str
    query: str
    created_at: str