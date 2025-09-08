from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.config.env import get_settings
import logging

logger = logging.getLogger(__name__)

# Get application settings
settings = get_settings()

# Create the declarative base for models
Base = declarative_base()

# Create async database engine
engine = create_async_engine(
    settings.POSTGRES_DB_URL,
    echo=settings.DEBUG,  # Enable SQL logging in debug mode
    future=True,
    pool_size=20,  # Connection pool size
    max_overflow=30,  # Additional connections beyond pool_size
    pool_pre_ping=True,  # Validate connections before use
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Dependency function to get database session
async def get_db() -> AsyncSession:
    """
    Dependency function that provides a database session.
    Automatically closes the session when done.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Function to create all tables (for testing/initialization)
async def create_tables():
    """Create all database tables"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise

# Function to drop all tables (for testing)
async def drop_tables():
    """Drop all database tables"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        logger.info("Database tables dropped successfully")
    except Exception as e:
        logger.error(f"Error dropping tables: {e}")
        raise

# Function to check database connection
async def check_db_connection():
    """Check if database connection is working"""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection check successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False