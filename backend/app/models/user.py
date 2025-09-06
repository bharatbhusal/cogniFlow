from pydantic import BaseModel

class User(BaseModel):
    id: int
    email: str
    name: str

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str
