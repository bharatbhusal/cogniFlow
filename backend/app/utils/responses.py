from typing import Any, Optional
from fastapi import status
from fastapi.responses import JSONResponse
from datetime import datetime


def create_success_response(
    message: str, data: Optional[Any] = None, status_code: int = status.HTTP_200_OK
) -> JSONResponse:
    """Create a standardized success response"""
    response_data = {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.now().isoformat(),
    }

    return JSONResponse(status_code=status_code, content=response_data)


def create_error_response(
    message: str,
    error_code: str,
    details: Optional[str] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> JSONResponse:
    """Create a standardized error response"""
    response_data = {
        "success": False,
        "message": message,
        "error_code": error_code,
        "details": details,
        "timestamp": datetime.now().isoformat(),
    }

    return JSONResponse(status_code=status_code, content=response_data)
