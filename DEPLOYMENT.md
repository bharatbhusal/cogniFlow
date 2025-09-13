# CogniFlow Deployment Guide

This guide provides comprehensive instructions for deploying CogniFlow to various environments, from development to production.

## 🚀 Deployment Options

### 1. Docker Compose (Recommended for Development)

The easiest way to run the entire CogniFlow stack locally.

#### Quick Start

```bash
# Clone the repository
git clone https://github.com/bharatbhusal/cogniFlow.git
cd cogniFlow

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Docker Compose Configuration

```yaml
# docker-compose.yml
version: "3.8"

services:
 postgres:
  image: postgres:15-alpine
  environment:
   POSTGRES_DB: cogniflow
   POSTGRES_USER: postgres
   POSTGRES_PASSWORD: password
  volumes:
   - postgres_data:/var/lib/postgresql/data
  ports:
   - "5432:5432"

 backend:
  build: ./backend
  ports:
   - "8000:8000"
  environment:
   - DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/cogniflow
   - OPENAI_API_KEY=${OPENAI_API_KEY}
  depends_on:
   - postgres
  volumes:
   - ./backend:/app

 frontend:
  build: ./frontend
  ports:
   - "5173:5173"
  environment:
   - VITE_API_BASE_URL=http://localhost:8000/api
  volumes:
   - ./frontend:/app
   - /app/node_modules

volumes:
 postgres_data:
```

### 2. Manual Deployment

For more control over the deployment process.

#### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 13+
- Git

#### Backend Deployment

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend Deployment

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with backend URL

# Build for production
npm run build

# Serve the built files (using a static server)
npm install -g serve
serve -s dist -l 5173
```

### 3. Production Deployment with Docker

#### Production Docker Setup

**Backend Dockerfile:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile:**

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Nginx Configuration:**

```nginx
# nginx.conf
events {}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;

        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Proxy API requests to backend
        location /api/ {
            proxy_pass http://backend:8000/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
 postgres:
  image: postgres:15-alpine
  environment:
   POSTGRES_DB: ${POSTGRES_DB:-cogniflow}
   POSTGRES_USER: ${POSTGRES_USER:-postgres}
   POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  volumes:
   - postgres_data:/var/lib/postgresql/data
  restart: unless-stopped

 backend:
  build:
   context: ./backend
   dockerfile: Dockerfile.prod
  environment:
   - DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
   - JWT_SECRET_KEY=${JWT_SECRET_KEY}
   - DEBUG=false
  depends_on:
   - postgres
  volumes:
   - ./backend/chromadb_data:/app/chromadb_data
  restart: unless-stopped

 frontend:
  build:
   context: ./frontend
   dockerfile: Dockerfile.prod
  ports:
   - "80:80"
  depends_on:
   - backend
  restart: unless-stopped

volumes:
 postgres_data:
```

## 🔧 Environment Configuration

### Production Environment Variables

**Backend (.env.prod):**

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@db-host:5432/cogniflow

# Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key-here

# Application
DEBUG=false
```

**Frontend (.env.prod):**

```env
VITE_API_BASE_URL=https:/localhost:8080/api
VITE_NODE_ENV=production
```
