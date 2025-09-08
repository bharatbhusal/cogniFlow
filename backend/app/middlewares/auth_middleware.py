from fastapi import HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.types.user import UserResponse
from app.models.user import User
from app.repositories.user import UserRepository
from app.utils.jwt import decode_access_token

async def get_current_user(request: Request, db: AsyncSession = Depends()) -> UserResponse:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = auth_header[7:]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid Token")

    user_id = payload.id
    # Query the user from the database
    user = await UserRepository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User Not Found")

    request.state.user = user
    return UserResponse(id=user.id, email=user.email)