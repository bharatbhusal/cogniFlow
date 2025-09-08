from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.middlewares.auth_middleware import get_current_user
from app.types.user import UserBaseDict, UserLogin, UserRegister, UserResponse, UserRegisterDict
from app.repositories.user import UserRepository
from app.config.db import get_db
from typing import Dict, Optional

router = APIRouter()

@router.post("/register")
async def register(user: UserRegisterDict, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing_user = await UserRepository.get_by_email(db=db, email=user["email"])
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = await UserRepository.create(db=db, user=user)
    return {"msg": "User registered successfully", "user_id": new_user.id}

@router.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    # Login logic here
    return {"access_token": "jwt_token", "token_type": "bearer"}

@router.get("/me")
async def get_me(user: UserResponse = Depends(get_current_user)):
    # Get current user info
    return {"user": user}
