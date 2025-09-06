# CogniFlow Backend (FastAPI)

## Overview

CogniFlow backend is a FastAPI server that powers the AI-driven workflow automation and data analysis features. It exposes RESTful endpoints for frontend consumption and integrates with various AI/ML services.

## Features

- User authentication (JWT, OAuth)
- Workflow and task management APIs
- Data ingestion and processing
- Integration with OpenAI, Google Cloud, AWS, Azure
- Secure environment variable management

## Tech Stack

- Python 3.10+
- FastAPI
- Pydantic
- SQLAlchemy (or similar ORM)
- PostgreSQL (recommended)

## Getting Started

1. Create a virtual environment:
   ```bash
   python -m venv env
   source env/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and set your environment variables (API keys, DB URL, etc).
4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Folder Structure

- `app/api/` - API route definitions
- `app/models/` - Pydantic models
- `app/services/` - Business logic
- `app/core/` - Config, dependencies
- `app/db/` - Database setup
- `tests/` - Unit and integration tests

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

See LICENSE file for details.
