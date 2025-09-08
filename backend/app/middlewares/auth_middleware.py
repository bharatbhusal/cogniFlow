from fastapi import HTTPException, Request, status
from app.types.user import AuthJWTTokenDict
from app.utils.jwt import decode_access_token

async def get_current_user(request: Request) -> AuthJWTTokenDict:
    """Extract user from JWT token (without DB query)"""
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    token = auth_header[7:]
    
    try:
        # Just return the decoded payload
        payload = decode_access_token(token)
        return payload  # This should already be AuthJWTTokenDict
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )