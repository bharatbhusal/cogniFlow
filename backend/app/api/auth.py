from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.middlewares.auth_middleware import get_current_user
from app.types.user import (
    UserRegisterDict,
    UserLoginDict,
    AuthJWTTokenDict,
)
from app.repositories.user import UserRepository
from app.config.db import get_db
from app.utils.hashing import hash_data, verify_data
from app.utils.jwt import create_access_token
from app.utils.responses import create_success_response, create_error_response

router = APIRouter()


@router.post("/register")
async def register(user: UserRegisterDict, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing_user = await UserRepository.get_by_email(db=db, email=user["email"])
    if existing_user:
        return create_error_response(
            message="Email already registered",
            error_code="EMAIL_EXISTS",
            status_code=400
        )

    # Hash the password before saving
    user_data: UserRegisterDict = {
        "email": user["email"],
        "password": hash_data(user["password"]),
    }
    # Create new user
    new_user = await UserRepository.create(db=db, user=user_data)
    return create_success_response(
        message="User registered successfully",
        data={"user": {"id": new_user.id, "email": new_user.email, "full_name": new_user.full_name}},
        status_code=201
    )


@router.post("/login")
async def login(user: UserLoginDict, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing_user = await UserRepository.get_by_email(db=db, email=user["email"])
    if not existing_user:
        return create_error_response(
            message="User doesn't exist",
            error_code="USER_NOT_FOUND",
            status_code=400
        )

    # Verify password
    if not verify_data(user["password"], existing_user.password):
        return create_error_response(
            message="Invalid email or password",
            error_code="INVALID_CREDENTIALS",
            status_code=400
        )

    token = create_access_token(
        {
            "id": existing_user.id,
            "password": user["password"],
            "email": existing_user.email,
        }
    )
    del existing_user.password
    return create_success_response(
        message="Login successful",
        data={"access_token": token, "user": {"id": existing_user.id, "email": existing_user.email, "full_name": existing_user.full_name}},
        status_code=200
    )


@router.get("/me")
async def get_me(user: AuthJWTTokenDict | None = Depends(get_current_user)):
    if user is not None:
        return create_success_response(
            message="User fetched successfully",
            data={"user": {"id": user.id, "email": user.email, "password": user.password}},
            status_code=200
        )
    return create_error_response(
        message="User not authenticated",
        error_code="NOT_AUTHENTICATED",
        status_code=401
    )
