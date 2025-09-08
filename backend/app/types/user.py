from datetime import datetime
from typing import Optional
from pydantic import BaseModel

# User Pydantic models
class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class UserRegister(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str
    
class Auth_JWT_Token(BaseModel):
    id: str
    username: str
    email: str
    password: str
    role: str