# CogniFlow Backend

CogniFlow Backend is a FastAPI-based server that powers the AI-driven workflow automation platform. It provides REST APIs for user authentication, project management, document processing, and AI workflow execution.

## 🏗️ Architecture Overview

The backend follows a clean architecture pattern with the following layers:

```
app/
├── api/               # API endpoints and routing
├── config/            # Configuration files (database, environment)
├── core/              # Core business logic
├── db/                # Database utilities and connections
├── middlewares/       # Custom middleware (auth, CORS, etc.)
├── models/            # SQLAlchemy database models
├── repositories/      # Data access layer
├── services/          # Business logic layer
├── types/             # Type definitions and Pydantic models
├── utils/             # Utility functions and helpers
└── main.py           # FastAPI application entry point
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 13+
- ChromaDB (for vector storage)
- OpenAI API key (for AI features)

### Environment Setup

1. Clone the repository:

```bash
https://github.com/bharatbhusal/cogniFlow
cd cogniFlow/backend
```

2. Create and activate virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

## 🗂️ Project Structure

### API Endpoints (`/app/api/`)

- **`auth.py`**: Authentication endpoints (login, register, profile)
- **`project.py`**: Project management endpoints (CRUD operations, document upload)
- **`open.py`**: Public endpoints (health check, system status)

### Models (`/app/models/`)

- **`user.py`**: User account and authentication
- **`project.py`**: Project information and metadata
- **`document.py`**: Document storage and processing
- **`message.py`**: Chat messages and conversation history
- **`workflow.py`**: Workflow definitions and execution
- **`*_node.py`**: Workflow node configurations (LLM, Knowledge Base, Web Search)

### Services (`/app/services/`)

- **`project_service.py`**: Project creation, management, and business logic
- **`workflow_executor.py`**: AI workflow execution engine
- **`knowledge_base_service.py`**: Document parsing and vector storage
- **`llm_service.py`**: OpenAI API text generation integration

### Configuration (`/app/config/`)

- **`db.py`**: Database connection and session management
- **`env.py`**: Environment variable configuration
- **`pockity.py`**: External service configurations (My own Storage-as-a-Service application)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. Register a new user: `POST /api/auth/register`
2. Login: `POST /api/auth/login` - Returns access token
3. Include token in requests: `Authorization: Bearer <token>`
4. Get current user: `GET /api/auth/me`

## 🛠️ Development

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Code Quality

```bash
# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

### Adding New Features

1. **Create Model**: Define database schema in `/app/models/`
2. **Create Types**: Define Pydantic models in `/app/types/`
3. **Create Repository**: Add data access methods in `/app/repositories/`
4. **Create Service**: Implement business logic in `/app/services/`
5. **Create API**: Add endpoints in `/app/api/`
6. **Create Migration**: Generate and apply database changes

## 🐳 Docker Support

### Development with Docker

```bash
# Build and start services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Build production image
docker build -t cogniflow-backend .

# Run container
docker run -d \
  --name cogniflow-backend \
  -p 8000:8000 \
  --env-file .env \
  cogniflow-backend
```

## 📊 Monitoring and Logging

The application includes structured logging and health checks:

- **Health Check**: `GET /api/open/health`
- **System Status**: Database connectivity, AI service availability
- **Logs**: Structured JSON logging with request tracking

## 🔧 Configuration

### Database Configuration

The application supports PostgreSQL with async connections via SQLAlchemy:

- Connection pooling
- Automatic reconnection
- Migration management with Alembic

### AI Integration

- **OpenAI GPT Integration**: For chat completions and embeddings
- **ChromaDB**: Vector database for document similarity search
- **Workflow Engine**: Custom workflow execution with multiple AI nodes

## 🚨 Error Handling

The API uses standardized error responses:

```json
{
	"success": false,
	"message": "Error description",
	"error_code": "ERROR_TYPE",
	"details": "Additional error details",
	"timestamp": "2025-09-14T10:30:00Z"
}
```

Common error codes:

- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `PERMISSION_DENIED`: Insufficient permissions
- `INTERNAL_SERVER_ERROR`: Server error

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run tests and quality checks
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
