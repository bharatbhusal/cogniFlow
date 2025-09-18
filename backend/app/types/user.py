from datetime import datetime
from typing import Optional, NotRequired
from typing_extensions import TypedDict
from pydantic import BaseModel


class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
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
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class OTPRequest(BaseModel):
    email: str
    purpose: str  # 'registration' or 'login'


class Auth_JWT_Token(BaseModel):
    id: str
    email: str
    password: str


# TypedDict versions for stricter typing
class UserBaseDict(TypedDict):
    email: str
    full_name: NotRequired[Optional[str]]


class UserUpdateDict(TypedDict, total=False):
    email: str
    full_name: str
    password: str


class UserResponseDict(TypedDict):
    id: int
    email: str
    full_name: NotRequired[Optional[str]]
    created_at: datetime
    updated_at: datetime


class UserRegisterDict(TypedDict):
    email: str
    password: str


class UserLoginDict(TypedDict):
    email: str
    password: str


class AuthJWTTokenDict(TypedDict):
    id: str
    email: str
    password: str


class OTPRequestDict(TypedDict):
    email: str
    purpose: str
