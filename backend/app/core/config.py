import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    # PostgreSQL Database
    POSTGRES_DB_URL: str = os.getenv("POSTGRES_DB_URL", "postgresql://postgres:password@localhost:5432/cogniflow")
    
    # Security (hardcoded for now)
    SECRET_KEY: str = "your-secret-key-change-in-production-12345678901234567890"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # ChromaDB Configuration
    CHROMADB_HOST: str = os.getenv("CHROMADB_HOST", "localhost")
    CHROMADB_PORT: int = int(os.getenv("CHROMADB_PORT", "8000"))
    CHROMADB_PERSIST_DIRECTORY: str = os.getenv("CHROMADB_PERSIST_DIRECTORY", "./chromadb_data")
    CHROMADB_COLLECTION_NAME: str = os.getenv("CHROMADB_COLLECTION_NAME", "documents")
    
    # File Upload Settings (hardcoded)
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    
    # Application Settings (hardcoded)
    DEBUG: bool = False
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:8000"]
    
    class Config:
        env_file = ".env"

def get_settings() -> Settings:
    return Settings()
    
    class Config:
        env_file = ".env"

def get_settings() -> Settings:
    return Settings()

