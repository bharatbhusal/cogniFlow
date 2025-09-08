from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.middlewares.auth_middleware import get_current_user
from app.types.user import  UserLogin, UserResponse, UserRegisterDict, UserLoginDict
from app.repositories.user import UserRepository
from app.config.db import get_db
from app.utils.hashing import hash_data, verify_data
from app.utils.jwt import create_access_token

router = APIRouter()

@router.post("/register")
async def register(user: UserRegisterDict, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing_user = await UserRepository.get_by_email(db=db, email=user["email"])
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password before saving
    user_data: UserRegisterDict = {
        "email": user["email"],
        "password": hash_data(user["password"])
        # "password": user["password"]  # For testing purposes only, remove in production
    }
    # Create new user
    new_user = await UserRepository.create(db=db, user=user_data)
    return {"msg": "User registered successfully", "user_id": new_user.id}

@router.post("/login")
async def login(user: UserLoginDict, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing_user = await UserRepository.get_by_email(db=db, email=user["email"])
    if not existing_user:
        raise HTTPException(status_code=400, detail="User doesn't exist")

    # Verify password
    if not verify_data(user["password"], existing_user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    token = create_access_token({"id": existing_user.id, "password": user["password"], "email": existing_user.email})
    print("Token : ", token)
    del existing_user.password
    return {"access_token": token, "user": existing_user}

@router.get("/me")
async def get_me(user: UserResponse = Depends(get_current_user)):
    # Get current user info
    return {"access_token": "jwt_token", "token_type": "bearer"}

@router.get("/me")
async def get_me(user: UserResponse = Depends(get_current_user)):
    # Get current user info
    return {"user": user}
