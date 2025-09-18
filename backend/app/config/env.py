import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    # PostgreSQL Database
    POSTGRES_DB_URL: str = os.getenv("POSTGRES_DB_URL")

    # JWT Configuration
    AUTH_SECRET_KEY: str = os.getenv("AUTH_SECRET_KEY")

    # ChromaDB (Local HTTP) configuration
    CHROMADB_HOST: str = os.getenv("CHROMADB_HOST", "localhost")
    CHROMADB_PORT: int = int(os.getenv("CHROMADB_PORT", "8000"))
    CHROMADB_SSL: bool = os.getenv("CHROMADB_SSL", "false").lower() in ("true", "1", "t", "yes")

    # Application Settings 
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:8000",
        "https://cogniflow.bharatbhusal.com",
        "https://backend-cogniflow.bharatbhusal.com"
    ]

    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

    POCKITY_API_URL: str = os.getenv("POCKITY_API_URL")
    POCKITY_ACCESS_KEY_ID: str = os.getenv("POCKITY_ACCESS_KEY_ID")
    POCKITY_SECRET_KEY: str = os.getenv("POCKITY_SECRET_KEY")

    # SMTP Email Configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_MAIL_ID: str = os.getenv("SMTP_MAIL_ID")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD")

def get_settings() -> Settings:
    return Settings()
