# CogniFlow High-Level Design (HLD)

This document provides a comprehensive architectural overview of CogniFlow, including system design, component interactions, data flow, and technical decisions.

## 🏗️ System Architecture

### Overview

CogniFlow is a modern full-stack application built with a microservices-oriented architecture, designed for scalability, maintainability, and performance.

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile App]
    end

    subgraph "Frontend Layer"
        REACT[React + TypeScript]
        REDUX[Redux Toolkit]
        ROUTER[React Router]
    end

    subgraph "API Gateway"
        FASTAPI[FastAPI Server]
        AUTH[JWT Middleware]
        CORS[CORS Middleware]
    end

    subgraph "Business Logic Layer"
        PROJ[Project Service]
        DOC[Document Service]
        WORKFLOW[Workflow Executor]
        AI[AI Service]
    end

    subgraph "Data Layer"
        POSTGRES[(PostgreSQL)]
        CHROMA[(ChromaDB)]
        FILES[File Storage]
    end

    subgraph "External Services"
        OPENAI[OpenAI API]
        SERPAPI[SerpAPI]
        POCKITY[Pockity CDN]
    end

    WEB --> REACT
    MOBILE --> REACT
    REACT --> REDUX
    REACT --> ROUTER
    REACT --> FASTAPI
    FASTAPI --> AUTH
    FASTAPI --> CORS
    FASTAPI --> PROJ
    FASTAPI --> DOC
    FASTAPI --> WORKFLOW
    PROJ --> POSTGRES
    DOC --> POSTGRES
    DOC --> CHROMA
    DOC --> FILES
    WORKFLOW --> AI
    AI --> OPENAI
    AI --> SERPAPI
    FILES --> POCKITY
```

## 🧱 Component Architecture

### Frontend Architecture

```mermaid
graph TD
    subgraph "React Application"
        APP[App.tsx]
        ROUTES[Router]
        LAYOUT[Layout Components]
    end

    subgraph "Pages"
        LOGIN[LoginPage]
        PROJECTS[ProjectsPage]
        CHAT[ChatPage]
        PROJECT[ProjectPage]
    end

    subgraph "Components"
        UI[UI Components]
        MODALS[Modals]
        PROJECT_COMP[Project Components]
        WORKFLOW_COMP[Workflow Components]
    end

    subgraph "State Management"
        STORE[Redux Store]
        AUTH_SLICE[Auth Slice]
        PROJECT_SLICE[Project Slice]
        UI_SLICE[UI Slice]
    end

    subgraph "Services"
        API[API Client]
        INTERCEPTORS[Request/Response Interceptors]
    end

    subgraph "Utilities"
        HOOKS[Custom Hooks]
        UTILS[Utility Functions]
        TYPES[Type Definitions]
    end

    APP --> ROUTES
    ROUTES --> LOGIN
    ROUTES --> PROJECTS
    ROUTES --> CHAT
    ROUTES --> PROJECT

    PROJECTS --> UI
    PROJECTS --> MODALS
    PROJECT --> PROJECT_COMP
    CHAT --> WORKFLOW_COMP

    UI --> STORE
    MODALS --> STORE
    PROJECT_COMP --> STORE

    STORE --> AUTH_SLICE
    STORE --> PROJECT_SLICE
    STORE --> UI_SLICE

    AUTH_SLICE --> API
    PROJECT_SLICE --> API
    API --> INTERCEPTORS

    UI --> HOOKS
    MODALS --> HOOKS
    HOOKS --> UTILS
    HOOKS --> TYPES
```

### Backend Architecture

```mermaid
graph TD
    subgraph "API Layer"
        MAIN[main.py]
        AUTH_API[auth.py]
        PROJECT_API[project.py]
        OPEN_API[open.py]
    end

    subgraph "Middleware"
        AUTH_MW[Auth Middleware]
        CORS_MW[CORS Middleware]
        ERROR_MW[Error Handler]
    end

    subgraph "Services"
        PROJECT_SVC[Project Service]
        DOC_SVC[Document Service]
        WORKFLOW_SVC[Workflow Executor]
        AI_SVC[AI Service]
    end

    subgraph "Repositories"
        USER_REPO[User Repository]
        PROJECT_REPO[Project Repository]
        DOC_REPO[Document Repository]
        MSG_REPO[Message Repository]
    end

    subgraph "Models"
        USER_MODEL[User Model]
        PROJECT_MODEL[Project Model]
        DOC_MODEL[Document Model]
        WORKFLOW_MODEL[Workflow Model]
    end

    subgraph "Configuration"
        DB_CONFIG[Database Config]
        ENV_CONFIG[Environment Config]
        AI_CONFIG[AI Config]
    end

    MAIN --> AUTH_API
    MAIN --> PROJECT_API
    MAIN --> OPEN_API
    MAIN --> AUTH_MW
    MAIN --> CORS_MW

    AUTH_API --> USER_REPO
    PROJECT_API --> PROJECT_SVC
    PROJECT_API --> DOC_SVC

    PROJECT_SVC --> PROJECT_REPO
    DOC_SVC --> DOC_REPO
    PROJECT_SVC --> WORKFLOW_SVC
    WORKFLOW_SVC --> AI_SVC

    USER_REPO --> USER_MODEL
    PROJECT_REPO --> PROJECT_MODEL
    DOC_REPO --> DOC_MODEL

    USER_MODEL --> DB_CONFIG
    PROJECT_MODEL --> DB_CONFIG
    DOC_MODEL --> DB_CONFIG

    AI_SVC --> AI_CONFIG
    DB_CONFIG --> ENV_CONFIG
```

## 📊 Data Flow Architecture

### User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth API
    participant D as Database
    participant J as JWT Service

    U->>F: Enter credentials
    F->>A: POST /auth/login
    A->>D: Verify credentials
    D-->>A: User data
    A->>J: Generate JWT token
    J-->>A: JWT token
    A-->>F: Auth response + token
    F->>F: Store token in localStorage
    F-->>U: Redirect to dashboard
```

### Project Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant P as Project API
    participant S as Project Service
    participant D as Database
    participant C as ChromaDB
    participant AI as AI Service

    U->>F: Create project + upload PDFs
    F->>P: POST /projects (multipart/form-data)
    P->>S: Process project creation
    S->>D: Save project metadata
    S->>S: Process PDF files
    S->>AI: Generate embeddings
    AI->>C: Store document vectors
    S-->>P: Project created
    P-->>F: Success response
    F-->>U: Show success notification
```

### AI Query Processing Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant P as Project API
    participant W as Workflow Executor
    participant C as ChromaDB
    participant AI as OpenAI API
    participant S as SerpAPI
    participant D as Database

    U->>F: Submit query
    F->>P: POST /projects/{id}/query
    P->>W: Execute workflow

    alt RAG Workflow
        W->>C: Vector similarity search
        C-->>W: Relevant documents
        W->>AI: Generate response with context
    else Web Search Workflow
        W->>S: Search web
        S-->>W: Search results
        W->>AI: Generate response with search results
    else Combined Workflow
        W->>C: Vector similarity search
        W->>S: Search web
        W->>AI: Generate response with both contexts
    end

    AI-->>W: Generated response
    W->>D: Save message
    W-->>P: Query response
    P-->>F: Response with sources
    F-->>U: Display AI response
```

## 🗄️ Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Project : owns
    Project ||--o{ Document : contains
    Project ||--o{ Message : has
    Project ||--o| Workflow : configures
    Project ||--o| LlmNode : has
    Project ||--o| KnowledgeBaseNode : has
    Project ||--o| WebSearchNode : has

    User {
        string id PK
        string email
        string password_hash
        string full_name
        datetime created_at
        datetime updated_at
    }

    Project {
        string id PK
        string name
        string description
        string owner_id FK
        datetime created_at
        datetime updated_at
    }

    Document {
        string id PK
        string name
        string file_path
        int file_size
        string project_id FK
        json chroma_document_ids
        boolean processed
        datetime created_at
    }

    Message {
        string id PK
        string content
        string role
        string project_id FK
        datetime created_at
    }

    Workflow {
        string id PK
        string workflow_type
        string project_id FK
        datetime created_at
    }

    LlmNode {
        string id PK
        string openai_api_key
        string llm_model_name
        float temperature
        int max_tokens
        string project_id FK
    }

    KnowledgeBaseNode {
        string id PK
        string openai_api_key
        string embedding_model_name
        int chunk_size
        int chunk_overlap
        string project_id FK
    }

    WebSearchNode {
        string id PK
        string serpapi_api_key
        int num_results
        string location
        string project_id FK
    }
```

### Data Storage Strategy

#### PostgreSQL (Primary Database)

- **User data**: Authentication, profiles, settings
- **Project metadata**: Names, descriptions, ownership
- **Document metadata**: File info, processing status
- **Message history**: Chat conversations
- **Workflow configurations**: Node settings, API keys

#### ChromaDB (Vector Database)

- **Document embeddings**: Vector representations of text chunks
- **Similarity search**: Fast retrieval of relevant content
- **Metadata storage**: Document references, chunk positions

#### File Storage

- **PDF files**: Original uploaded documents
- **Processed text**: Extracted and chunked content
- **Temporary files**: Upload processing

## 🔄 Workflow Engine Design

### Workflow Types

```mermaid
graph LR
    subgraph "RAG Only"
        QUERY1[User Query] --> KB1[Knowledge Base]
        KB1 --> LLM1[LLM Response]
    end

    subgraph "Web Search Only"
        QUERY2[User Query] --> WS[Web Search]
        WS --> LLM2[LLM Response]
    end

    subgraph "RAG + Web Search"
        QUERY3[User Query] --> KB2[Knowledge Base]
        QUERY3 --> WS2[Web Search]
        KB2 --> LLM3[LLM Response]
        WS2 --> LLM3
    end

    subgraph "LLM Only"
        QUERY4[User Query] --> LLM4[Direct LLM Response]
    end
```

### Workflow Execution Engine

```python
class WorkflowExecutor:
    async def execute(self, workflow_type: str, query: str, context: dict) -> dict:
        execution_log = []
        sources = []

        if workflow_type in ["rag_only", "rag_with_web_search"]:
            # Knowledge base search
            kb_results = await self.search_knowledge_base(query, context)
            sources.extend(kb_results["sources"])
            execution_log.append({
                "node": "knowledge_base",
                "status": "success",
                "results_count": len(kb_results["documents"])
            })

        if workflow_type in ["web_search_only", "rag_with_web_search"]:
            # Web search
            web_results = await self.search_web(query, context)
            sources.extend(web_results["sources"])
            execution_log.append({
                "node": "web_search",
                "status": "success",
                "results_count": len(web_results["results"])
            })

        # Generate LLM response
        llm_response = await self.generate_response(query, sources, context)
        execution_log.append({
            "node": "llm",
            "status": "success",
            "token_count": llm_response["usage"]["total_tokens"]
        })

        return {
            "response_text": llm_response["content"],
            "execution_log": execution_log,
            "retrieved_sources": sources
        }
```

## 🔒 Security Architecture

### Authentication & Authorization

```mermaid
graph TD
    subgraph "Authentication Flow"
        LOGIN[User Login] --> VERIFY[Verify Credentials]
        VERIFY --> JWT[Generate JWT Token]
        JWT --> STORE[Store in localStorage]
    end

    subgraph "Authorization Middleware"
        REQUEST[API Request] --> EXTRACT[Extract JWT Token]
        EXTRACT --> VALIDATE[Validate Token]
        VALIDATE --> DECODE[Decode User Info]
        DECODE --> AUTHORIZE[Check Permissions]
    end

    subgraph "Security Features"
        HASH[Password Hashing]
        EXPIRE[Token Expiration]
        CORS[CORS Protection]
        HTTPS[HTTPS Encryption]
    end
```

### Security Measures

#### Backend Security

- **JWT Authentication**: Stateless token-based auth
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Pydantic models for request validation
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
- **CORS Configuration**: Controlled cross-origin access
- **Rate Limiting**: API endpoint protection (planned)

#### Frontend Security

- **Token Storage**: JWT tokens in localStorage (consider httpOnly cookies for production)
- **Auto-logout**: Token expiration handling
- **Protected Routes**: Route-level authentication checks
- **Input Sanitization**: Form validation and sanitization
- **HTTPS Enforcement**: Secure communication in production

#### Data Security

- **API Key Encryption**: User API keys encrypted at rest
- **File Upload Validation**: File type and size restrictions
- **Access Control**: User-based resource isolation
- **Audit Logging**: User action tracking (planned)

## 🚀 Performance Architecture

### Frontend Performance

```mermaid
graph TD
    subgraph "Loading Optimization"
        LAZY[Lazy Loading] --> CODE_SPLIT[Code Splitting]
        CODE_SPLIT --> BUNDLE[Bundle Optimization]
    end

    subgraph "State Management"
        REDUX[Redux Store] --> SELECTORS[Memoized Selectors]
        SELECTORS --> CACHE[Component Memoization]
    end

    subgraph "UI Performance"
        VIRTUAL[Virtual Scrolling] --> DEBOUNCE[Input Debouncing]
        DEBOUNCE --> OPTIMIZE[Re-render Optimization]
    end
```

#### Optimization Strategies

- **Code Splitting**: Route-based lazy loading
- **Bundle Optimization**: Tree shaking and minification
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtual Scrolling**: Efficient rendering of large lists
- **Debounced Inputs**: Reduced API calls for search/filter operations

### Backend Performance

```mermaid
graph TD
    subgraph "Database Optimization"
        INDEX[Database Indexing] --> POOL[Connection Pooling]
        POOL --> ASYNC[Async Operations]
    end

    subgraph "API Performance"
        CACHE[Response Caching] --> PAGINATE[Pagination]
        PAGINATE --> COMPRESS[Response Compression]
    end

    subgraph "Vector Search"
        EMBED[Efficient Embeddings] --> SIMILARITY[Fast Similarity Search]
        SIMILARITY --> BATCH[Batch Processing]
    end
```

#### Optimization Strategies

- **Async/Await**: Non-blocking I/O operations
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Vector Search Optimization**: ChromaDB indexing and caching
- **Response Compression**: Reduced payload sizes
- **Pagination**: Controlled data loading

### Caching Strategy

```mermaid
graph TD
    subgraph "Frontend Caching"
        BROWSER[Browser Cache] --> REDUX[Redux State Cache]
        REDUX --> LOCAL[localStorage]
    end

    subgraph "Backend Caching"
        MEMORY[In-Memory Cache] --> DB[Database Query Cache]
        DB --> VECTOR[Vector Search Cache]
    end

    subgraph "CDN Caching"
        STATIC[Static Assets] --> FILES[File Storage]
        FILES --> API[API Response Cache]
    end
```

## 📈 Scalability Design

### Horizontal Scaling

```mermaid
graph TD
    subgraph "Load Balancer"
        LB[nginx/HAProxy]
    end

    subgraph "Frontend Instances"
        F1[Frontend 1]
        F2[Frontend 2]
        F3[Frontend 3]
    end

    subgraph "Backend Instances"
        B1[Backend 1]
        B2[Backend 2]
        B3[Backend 3]
    end

    subgraph "Database Cluster"
        DB_MASTER[(PostgreSQL Master)]
        DB_REPLICA1[(PostgreSQL Replica 1)]
        DB_REPLICA2[(PostgreSQL Replica 2)]
    end

    subgraph "Vector Database"
        CHROMA1[(ChromaDB 1)]
        CHROMA2[(ChromaDB 2)]
    end

    LB --> F1
    LB --> F2
    LB --> F3

    F1 --> B1
    F2 --> B2
    F3 --> B3

    B1 --> DB_MASTER
    B2 --> DB_REPLICA1
    B3 --> DB_REPLICA2

    B1 --> CHROMA1
    B2 --> CHROMA2
```

### Microservices Architecture (Future)

```mermaid
graph TD
    subgraph "API Gateway"
        GATEWAY[Kong/Ambassador]
    end

    subgraph "Core Services"
        AUTH[Auth Service]
        PROJECT[Project Service]
        DOCUMENT[Document Service]
        AI[AI Service]
    end

    subgraph "Supporting Services"
        FILE[File Service]
        NOTIFICATION[Notification Service]
        ANALYTICS[Analytics Service]
    end

    subgraph "Data Services"
        USER_DB[(User Database)]
        PROJECT_DB[(Project Database)]
        VECTOR_DB[(Vector Database)]
        FILE_STORAGE[File Storage]
    end

    GATEWAY --> AUTH
    GATEWAY --> PROJECT
    GATEWAY --> DOCUMENT
    GATEWAY --> AI

    AUTH --> USER_DB
    PROJECT --> PROJECT_DB
    DOCUMENT --> VECTOR_DB
    DOCUMENT --> FILE_STORAGE
    AI --> VECTOR_DB
```

## 🔍 Monitoring & Observability

### Logging Architecture

```mermaid
graph TD
    subgraph "Application Logs"
        FRONTEND[Frontend Logs]
        BACKEND[Backend Logs]
        DATABASE[Database Logs]
    end

    subgraph "Log Aggregation"
        ELK[ELK Stack]
        LOKI[Grafana Loki]
    end

    subgraph "Monitoring"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        ALERTS[Alert Manager]
    end

    subgraph "Tracing"
        JAEGER[Jaeger]
        OTEL[OpenTelemetry]
    end

    FRONTEND --> ELK
    BACKEND --> ELK
    DATABASE --> ELK

    ELK --> GRAFANA
    PROMETHEUS --> GRAFANA
    GRAFANA --> ALERTS

    BACKEND --> OTEL
    OTEL --> JAEGER
```

### Metrics & KPIs

#### Technical Metrics

- **Response Time**: API endpoint latency
- **Throughput**: Requests per second
- **Error Rate**: 4xx/5xx error percentage
- **Database Performance**: Query execution time
- **Memory Usage**: Application memory consumption
- **CPU Utilization**: Server resource usage

#### Business Metrics

- **User Activity**: Daily/monthly active users
- **Project Creation**: New projects per day
- **Document Processing**: Files processed per hour
- **Query Volume**: AI queries per user
- **Feature Usage**: Workflow type distribution

## 🚀 Deployment Architecture

### CI/CD Pipeline

```mermaid
graph LR
    subgraph "Source Control"
        GIT[Git Repository]
    end

    subgraph "CI Pipeline"
        BUILD[Build & Test]
        QUALITY[Quality Checks]
        SECURITY[Security Scan]
    end

    subgraph "CD Pipeline"
        STAGING[Deploy to Staging]
        TEST_STAGING[Staging Tests]
        PROD[Deploy to Production]
    end

    subgraph "Infrastructure"
        K8S[Kubernetes]
        DOCKER[Docker Registry]
        MONITORING[Monitoring Setup]
    end

    GIT --> BUILD
    BUILD --> QUALITY
    QUALITY --> SECURITY
    SECURITY --> STAGING
    STAGING --> TEST_STAGING
    TEST_STAGING --> PROD
    PROD --> K8S
    K8S --> DOCKER
    K8S --> MONITORING
```

## 🔮 Future Enhancements

### Planned Features

- **Multi-tenant Architecture**: Support for organizations
- **Advanced Analytics**: Usage dashboards and insights
- **API Marketplace**: Third-party integrations
- **Mobile Application**: Native iOS/Android apps
- **Advanced Workflows**: Visual workflow builder
- **Real-time Collaboration**: Multi-user project editing
- **Enterprise Features**: SSO, advanced security, compliance

### Technical Improvements

- **GraphQL API**: More flexible data fetching
- **Event-Driven Architecture**: Async processing
- **Advanced Caching**: Redis-based caching layer
- **ML Pipeline**: Custom model training and deployment
- **Edge Computing**: CDN-based processing
- **Blockchain Integration**: Document verification and provenance

## 📋 Technical Decisions

### Framework Choices

#### Frontend: React + TypeScript

**Rationale**:

- Strong ecosystem and community support
- Excellent TypeScript integration
- Rich component library ecosystem
- Good performance with modern React features

#### Backend: FastAPI + Python

**Rationale**:

- High performance async capabilities
- Excellent OpenAPI documentation generation
- Strong Python AI/ML ecosystem integration
- Type hints and validation built-in

#### Database: PostgreSQL + ChromaDB

**Rationale**:

- PostgreSQL: ACID compliance, JSON support, strong ecosystem
- ChromaDB: Optimized for vector operations, easy Python integration
- Separation of concerns: relational data vs. vector data

### Design Patterns

#### Frontend Patterns

- **Redux Toolkit**: Simplified state management
- **Custom Hooks**: Logic reusability
- **Compound Components**: Flexible component APIs
- **Error Boundaries**: Graceful error handling

#### Backend Patterns

- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic separation
- **Dependency Injection**: Testable, modular code
- **Strategy Pattern**: Workflow execution flexibility
