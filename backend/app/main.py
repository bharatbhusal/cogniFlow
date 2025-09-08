from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import auth, interact, project, open
from app.config.env import get_settings
from app.config.db import check_db_connection, create_tables
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan manager for FastAPI application.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting CogniFlow API...")
    
    # Check database connection
    logger.info("Checking database connection...")
    db_connected = await check_db_connection()
    
    if not db_connected:
        if settings.DEBUG:
            logger.warning("⚠️  Database connection failed in DEBUG mode - continuing without DB")
            logger.warning("Some features may not work properly without database")
        else:
            logger.error("Failed to connect to database!")
            raise Exception("Database connection failed. Please check your database configuration.")
    else:
        logger.info("✓ Database connection successful")
        
        # Create tables if they don't exist (in debug mode)
        if settings.DEBUG:
            logger.info("Debug mode: Ensuring database tables exist...")
            try:
                await create_tables()
                logger.info("✓ Database tables verified")
            except Exception as e:
                logger.error(f"Table creation failed: {e}")
                raise Exception(f"Database table creation failed: {e}")
    
    logger.info("🚀 CogniFlow API startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down CogniFlow API...")
    logger.info("👋 CogniFlow API shutdown complete")

app = FastAPI(
    title="CogniFlow API",
    description="AI-driven workflow automation platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(project.router, prefix="/api/workflows", tags=["workflows"])
app.include_router(interact.router, prefix="/api/ai", tags=["ai"])
app.include_router(open.router, prefix="/api/open", tags=["open"])
