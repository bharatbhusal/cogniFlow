#!/usr/bin/env python3
"""
Database setup and initialization script for CogniFlow RAG System
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.core.config import get_settings
from app.db.database import engine, create_tables, drop_tables
from app.models.database_models import *
from sqlalchemy import text

def check_postgresql_connection():
    """Check if PostgreSQL connection is working"""
    settings = get_settings()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()
            print(f"✅ PostgreSQL connection successful!")
            print(f"   Database version: {version[0]}")
            return True
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        print("\n💡 Make sure PostgreSQL is running and the database exists:")
        print("   1. Start PostgreSQL service")
        print("   2. Create database: CREATE DATABASE cogniflow;")
        print(f"   3. Update POSTGRES_DB_URL in .env file")
        return False

def create_database_tables():
    """Create all database tables"""
    try:
        print("📊 Creating database tables...")
        create_tables()
        print("✅ Database tables created successfully!")
        
        # Verify tables were created
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result.fetchall()]
            
        print(f"📋 Created tables: {', '.join(tables)}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create database tables: {e}")
        return False

def setup_chromadb_directory():
    """Setup ChromaDB persistent directory"""
    settings = get_settings()
    chromadb_path = Path(settings.CHROMADB_PERSIST_DIRECTORY)
    
    try:
        chromadb_path.mkdir(parents=True, exist_ok=True)
        print(f"📁 ChromaDB directory created: {chromadb_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to create ChromaDB directory: {e}")
        return False

def setup_upload_directory():
    """Setup file upload directory"""
    settings = get_settings()
    upload_path = Path(settings.UPLOAD_DIR)
    
    try:
        upload_path.mkdir(parents=True, exist_ok=True)
        print(f"📁 Upload directory created: {upload_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to create upload directory: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 CogniFlow RAG System Database Setup")
    print("=" * 50)
    
    # Check if .env file exists
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env file not found!")
        print("💡 Copy .env.example to .env and configure your settings")
        return False
    
    settings = get_settings()
    
    # Display configuration
    print(f"📋 Configuration:")
    print(f"   PostgreSQL URL: {settings.POSTGRES_DB_URL}")
    print(f"   ChromaDB Directory: {settings.CHROMADB_PERSIST_DIRECTORY}")
    print(f"   Upload Directory: {settings.UPLOAD_DIR}")
    print(f"   OpenAI API Key: {'✅ Set' if settings.OPENAI_API_KEY else '❌ Not Set'}")
    print()
    
    # Setup steps
    steps = [
        ("PostgreSQL Connection", check_postgresql_connection),
        ("Database Tables", create_database_tables),
        ("ChromaDB Directory", setup_chromadb_directory),
        ("Upload Directory", setup_upload_directory),
    ]
    
    success_count = 0
    for step_name, step_func in steps:
        print(f"🔄 {step_name}...")
        if step_func():
            success_count += 1
        print()
    
    # Summary
    print("=" * 50)
    if success_count == len(steps):
        print("🎉 Database setup completed successfully!")
        print("\n📝 Next steps:")
        print("   1. Start the FastAPI server: uvicorn app.main:app --reload")
        print("   2. Upload documents via /api/ai/documents/upload")
        print("   3. Test RAG workflows via /api/ai/workflows/execute")
        return True
    else:
        print(f"⚠️  Setup completed with {len(steps) - success_count} errors")
        print("   Please fix the issues above and run setup again")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
