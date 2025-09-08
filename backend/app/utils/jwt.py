from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.config.env import get_settings
from app.types.user import AuthJWTTokenDict

settings = get_settings()


def create_access_token(data: AuthJWTTokenDict) -> str:
    """
    Create a JWT access token without expiration.
    """
    encoded_jwt = jwt.encode(data, settings.AUTH_SECRET_KEY)
    return encoded_jwt


def decode_access_token(token: str) -> AuthJWTTokenDict:
    """
    Decode a JWT token and return the payload.
    Raises HTTPException if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, settings.AUTH_SECRET_KEY)
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )