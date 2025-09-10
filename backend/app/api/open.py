from fastapi import APIRouter
from app.config.db import check_db_connection

router = APIRouter()


@router.get("/root")
async def root():
    return {
        "message": "CogniFlow API is running",
        "version": "1.0.0",
        "status": "healthy",
    }


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    db_status = await check_db_connection()

    return {
        "status": "healthy" if db_status else "partial",
        "database": "connected" if db_status else "disconnected",
        "version": "1.0.0",
    }
