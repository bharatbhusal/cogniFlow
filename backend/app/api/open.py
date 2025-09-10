from fastapi import APIRouter
from app.config.db import check_db_connection
from app.utils.responses import create_success_response, create_error_response

router = APIRouter()


@router.get("/root")
async def root():
    return create_success_response(
        message="CogniFlow API is running",
        data={
            "version": "1.0.0",
            "status": "healthy"
        },
        status_code=200
    )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    db_status = await check_db_connection()
    status = "healthy" if db_status else "partial"
    database = "connected" if db_status else "disconnected"
    data = {
        "status": status,
        "database": database,
        "version": "1.0.0"
    }
    if db_status:
        return create_success_response(
            message="API and database are healthy",
            data=data,
            status_code=200
        )
    else:
        return create_error_response(
            message="Database connection failed",
            error_code="DB_DISCONNECTED",
            details="API is running but database is not connected",
            status_code=503
        )
