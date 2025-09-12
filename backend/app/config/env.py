import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    # PostgreSQL Database
    POSTGRES_DB_URL: str = os.getenv("POSTGRES_DB_URL")

    # JWT Configuration
    AUTH_SECRET_KEY: str = os.getenv("AUTH_SECRET_KEY")

    # OpenAI Configuration
    # OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")

    # ChromaDB Configuration
    CHROMADB_HOST: str = os.getenv("CHROMADB_HOST", "localhost")
    CHROMADB_PORT: int = int(os.getenv("CHROMADB_PORT", "8000"))
    CHROMADB_PERSIST_DIRECTORY: str = os.getenv(
        "CHROMADB_PERSIST_DIRECTORY", "./chromadb_data"
    )
    CHROMADB_UPLOAD_DIR: str = os.getenv("CHROMADB_UPLOAD_DIR", "./uploads")
    CHROMADB_COLLECTION_NAME: str = os.getenv("CHROMADB_COLLECTION_NAME", "documents")

    # Application Settings (hardcoded)
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:8000"]

    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

    POCKITY_API_URL: str = os.getenv("POCKITY_API_URL")
    POCKITY_ACCESS_KEY_ID: str = os.getenv("POCKITY_ACCESS_KEY_ID")
    POCKITY_SECRET_KEY: str = os.getenv("POCKITY_SECRET_KEY")

def get_settings() -> Settings:
    return Settings()
