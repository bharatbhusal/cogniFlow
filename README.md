# CogniFlow 🧠✨

CogniFlow is an AI-powered platform for intelligent workflow automation and document processing. It combines the power of Large Language Models (LLMs), document analysis, and web search capabilities to create sophisticated AI workflows that can understand, analyze, and respond to complex queries based on your documents and real-time information.

## 🌟 Key Features

- **📄 Document Processing**: Upload and process PDF documents with automatic text extraction and vectorization
- **🤖 AI Chat Interface**: Interactive conversations with AI powered by your documents
- **🔄 Flexible Workflows**: Configure custom AI workflows with multiple processing nodes
- **🔍 Multi-Source Intelligence**: Combine document knowledge with web search results
- **👥 User Management**: Secure authentication and personalized project spaces
- **⚡ Real-time Processing**: Fast document processing and query responses
- **🎨 Modern UI**: Clean, responsive interface built with React and TypeScript

## 🏗️ Architecture Overview

CogniFlow follows a modern full-stack architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│                 │    │                 │    │   Services      │
│ React + TypeScript│◄──►│ FastAPI + Python│◄──►│                 │
│ Redux Toolkit   │    │ PostgreSQL      │    │ OpenAI API      │
│ Tailwind CSS    │    │ ChromaDB        │    │ SerpAPI         │
│ Vite            │    │ Alembic         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend (`/frontend`)

- **React 18** with TypeScript for type-safe development
- **Redux Toolkit** for state management
- **Tailwind CSS** for responsive styling
- **Vite** for fast development and building
- **React Router** for navigation

### Backend (`/backend`)

- **FastAPI** for high-performance API development
- **PostgreSQL** with async SQLAlchemy for data persistence
- **ChromaDB** for vector storage and similarity search
- **Alembic** for database migrations
- **JWT** authentication

### AI Integration

- **OpenAI GPT** models for natural language processing
- **Text embeddings** for document similarity search
- **Custom workflow engine** for multi-step AI processing
- **Web search integration** for real-time information

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm/yarn
- **Python 3.11+** and pip
- **PostgreSQL 13+**
- **OpenAI API key**
- **SerpAPI key** (optional, for web search)

### 1. Clone the Repository

```bash
git clone https://github.com/bharatbhusal/cogniFlow.git
cd cogniFlow
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API credentials

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend URL

# Start the development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000

## 📂 Project Structure

```
cogniFlow/
├── 📁 frontend/              # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Redux state management
│   │   ├── services/        # API communication
│   │   ├── types/           # TypeScript definitions
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── README.md
│
├── 📁 backend/               # FastAPI Python backend
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access layer
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration
│   │   └── main.py         # Application entry point
│   ├── alembic/            # Database migrations
│   ├── requirements.txt
│   └── README.md
│
├── 📋 docker-compose.yml     # Docker orchestration
├── 📋 Dockerfile            # Container definitions
├── 🏗️ HLD.md               # High-level design document
└── 📖 README.md             # This file
```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Service Containers

```bash
# Backend only
cd backend
docker build -t cogniflow-backend .
docker run -p 8000:8000 --env-file .env cogniflow-backend

# Frontend only
cd frontend
docker build -t cogniflow-frontend .
docker run -p 5173:80 cogniflow-frontend
```

## 🔧 Configuration

### Environment Variables

#### Backend (`.env`)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/cogniflow

# Authentication
JWT_SECRET_KEY=your-secret-key-here

# Application
DEBUG=true
```

#### Frontend (`.env`)

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000/api

# Development
VITE_NODE_ENV=development
```

## 🎯 Usage Examples

### Creating a Project

1. **Register/Login** to your account
2. **Create New Project** from the dashboard
3. **Upload PDF documents** for processing
4. **Configure AI workflow** (optional)
5. **Start chatting** with your documents

### AI Workflows

CogniFlow supports different workflow types:

- **RAG Only**: Query documents using Retrieval Augmented Generation
- **Web Search**: Get real-time information from the web
- **RAG + Web Search**: Combine document knowledge with web search
- **LLM Only**: Direct GPT queries without additional context

### API Usage

```bash
# Create a project
curl -X POST http://localhost:8000/api/projects \
  -H "Authorization: Bearer <token>" \
  -F "name=Research Project" \
  -F "pdf_files=@document.pdf"

# Query the project
curl -X POST http://localhost:8000/api/projects/{project_id}/query \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the main findings?", "include_conversation_history": true}'
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes and add tests
4. **Run** quality checks: `npm run lint` (frontend) and `black .` (backend)
5. **Commit** your changes: `git commit -m 'Add amazing feature'`
6. **Push** to branch: `git push origin feature/amazing-feature`
7. **Create** a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style and patterns
- Update documentation for API changes
- Use meaningful commit messages
- Ensure all CI checks pass

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors**

- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

**API Authentication Issues**

- Check JWT token validity
- Verify API endpoint URLs
- Clear browser localStorage if needed

**File Upload Problems**

- Check file size limits (10MB default)
- Verify PDF file format
- Check server disk space

**Performance Issues**

- Monitor database query performance
- Check vector database indexing
- Review API response times

**Built with dedication by [Bharat Bhusal](https://github.com/bharatbhusal)**

_CogniFlow - Where AI meets intelligent document processing_ 🚀
