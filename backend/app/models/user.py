from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id: int
    email: EmailStr
    name: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
