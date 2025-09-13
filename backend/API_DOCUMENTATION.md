# CogniFlow API Documentation

This document provides comprehensive information about CogniFlow's REST API endpoints, including authentication, request/response formats, and usage examples.

## 🔗 Base URL

```
http://localhost:8000/api
```

## 🔐 Authentication

CogniFlow uses JWT (JSON Web Token) based authentication. Most endpoints require authentication.

### Authentication Header

Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## 📊 Response Format

All API responses follow a consistent format:

### Success Response

```json
{
	"success": true,
	"message": "Operation completed successfully",
	"data": {}, // Response data
	"timestamp": "2025-09-14T10:30:00Z"
}
```

### Error Response

```json
{
	"success": false,
	"message": "Error description",
	"error_code": "ERROR_TYPE",
	"details": "Additional error details (optional)",
	"timestamp": "2025-09-14T10:30:00Z"
}
```

## 🛣️ API Endpoints

### Authentication Endpoints (`/api/auth`)

#### Register User

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
	"email": "user@example.com",
	"password": "securepassword"
}
```

**Response:**

```json
{
	"success": true,
	"message": "User registered successfully",
	"data": {
		"user": {
			"id": "cm1k2j3l4m5n6o7p8q9r0s1t",
			"email": "user@example.com",
			"full_name": null
		}
	}
}
```

**Error Codes:**

- `EMAIL_EXISTS`: Email already registered
- `VALIDATION_ERROR`: Invalid email or password format

---

#### Login User

**POST** `/api/auth/login`

Authenticate user and return JWT token.

**Request Body:**

```json
{
	"email": "user@example.com",
	"password": "securepassword"
}
```

**Response:**

```json
{
	"success": true,
	"message": "Login successful",
	"data": {
		"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
		"user": {
			"id": "cm1k2j3l4m5n6o7p8q9r0s1t",
			"email": "user@example.com",
			"full_name": null
		}
	}
}
```

**Error Codes:**

- `USER_NOT_FOUND`: Email not registered
- `INVALID_CREDENTIALS`: Wrong password

---

#### Get Current User

**GET** `/api/auth/me`

Get current authenticated user information.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
	"success": true,
	"message": "User fetched successfully",
	"data": {
		"user": {
			"id": "cm1k2j3l4m5n6o7p8q9r0s1t",
			"email": "user@example.com",
			"password": "hashed_password"
		}
	}
}
```

**Error Codes:**

- `NOT_AUTHENTICATED`: Invalid or missing token

---

### Project Management Endpoints (`/api/projects`)

#### Create Project

**POST** `/api/projects`

Create a new project with optional PDF file uploads.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**

- `name` (required): Project name
- `description` (optional): Project description
- `pdf_files` (optional): PDF files to upload
- `workflow` (optional): Workflow configuration
- `kb_node_config` (optional): Knowledge base node configuration
- `llm_node_config` (optional): LLM node configuration
- `web_search_node_config` (optional): Web search node configuration

**Example Request:**

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Authorization: Bearer <token>" \
  -F "name=My Project" \
  -F "description=Project description" \
  -F "pdf_files=@document1.pdf" \
  -F "pdf_files=@document2.pdf"
```

**Response:**

```json
{
	"success": true,
	"message": "Project created successfully",
	"data": {
		"id": "cm1k2j3l4m5n6o7p8q9r0s1t",
		"name": "My Project",
		"description": "Project description",
		"owner_id": "cm1k2j3l4m5n6o7p8q9r0s1u",
		"created_at": "2025-09-14T10:30:00Z",
		"updated_at": "2025-09-14T10:30:00Z",
		"documents": [
			{
				"id": "doc1",
				"name": "document1.pdf",
				"size": 1024,
				"processed": true
			}
		]
	}
}
```

**Error Codes:**

- `VALIDATION_ERROR`: Invalid input data
- `FILE_PROCESSING_ERROR`: Failed to process uploaded files
- `INTERNAL_SERVER_ERROR`: Server error during creation

---

#### List Projects

**GET** `/api/projects/`

Get all projects for the authenticated user.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
	"success": true,
	"message": "Projects retrieved successfully",
	"data": {
		"projects": [
			{
				"id": "cm1k2j3l4m5n6o7p8q9r0s1t",
				"name": "My Project",
				"description": "Project description",
				"created_at": "2025-09-14T10:30:00Z",
				"document_count": 2
			}
		],
		"total_count": 1
	}
}
```

---

#### Get Project Details

**GET** `/api/projects/{project_id}`

Get detailed information about a specific project.

**Path Parameters:**

- `project_id`: Project ID

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
	"success": true,
	"message": "Project details retrieved successfully",
	"data": {
		"id": "cm1k2j3l4m5n6o7p8q9r0s1t",
		"name": "My Project",
		"description": "Project description",
		"owner_id": "cm1k2j3l4m5n6o7p8q9r0s1u",
		"created_at": "2025-09-14T10:30:00Z",
		"updated_at": "2025-09-14T10:30:00Z",
		"documents": [
			{
				"id": "doc1",
				"name": "document1.pdf",
				"size": 1024,
				"processed": true,
				"created_at": "2025-09-14T10:30:00Z"
			}
		],
		"workflow": "kb_llm"
	}
}
```

**Error Codes:**

- `PROJECT_NOT_FOUND`: Project doesn't exist
- `PROJECT_ACCESS_ERROR`: User doesn't have access to project

---

#### Update Project

**PUT** `/api/projects/{project_id}`

Update project information, add/remove documents, or modify configuration.

**Path Parameters:**

- `project_id`: Project ID

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**

- `name` (optional): New project name
- `description` (optional): New project description
- `pdf_files` (optional): New PDF files to add
- `delete_documents` (optional): Comma-separated document IDs to delete
- `workflow` (optional): New workflow configuration
- `kb_node_config` (optional): Knowledge base node configuration
- `llm_node_config` (optional): LLM node configuration
- `web_search_node_config` (optional): Web search node configuration

**Response:**

```json
{
	"success": true,
	"message": "Project updated successfully",
	"data": {
		"id": "cm1k2j3l4m5n6o7p8q9r0s1t",
		"name": "Updated Project Name",
		"description": "Updated description",
		"updated_at": "2025-09-14T11:30:00Z",
		"documents": []
	}
}
```

**Error Codes:**

- `PROJECT_NOT_FOUND`: Project doesn't exist
- `PROJECT_UPDATE_ERROR`: Failed to update project
- `FILE_PROCESSING_ERROR`: Failed to process new files

---

#### Delete Project

**DELETE** `/api/projects/{project_id}`

Delete a project and all its associated documents.

**Path Parameters:**

- `project_id`: Project ID

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
	"success": true,
	"message": "Project deleted successfully",
	"data": {
		"deleted_project_id": "cm1k2j3l4m5n6o7p8q9r0s1t",
		"deleted_documents": 3
	}
}
```

**Error Codes:**

- `PROJECT_NOT_FOUND`: Project doesn't exist
- `PROJECT_DELETION_ERROR`: Failed to delete project

---

#### Query Project

**POST** `/api/projects/{project_id}/query`

Execute an AI query against a project's documents using the configured workflow.

**Path Parameters:**

- `project_id`: Project ID

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
	"query": "What are the main topics discussed in the documents?"
}
```

**Response:**

```json
{
	"success": true,
	"message": "Query executed successfully",
	"data": {
		"query": "What are the main topics discussed in the documents?",
		"project_id": "cm1k2j3l4m5n6o7p8q9r0s1t",
		"response": {
			"id": "msg123",
			"content": "Based on the documents, the main topics are...",
			"created_at": "2025-09-14T10:30:00Z",
			"role": "assistant"
		},
		"conversation_history_included": true,
		"workflow_used": "rag_with_web_search",
		"execution_log": [
			{
				"node": "knowledge_base",
				"status": "success",
				"duration": 0.5
			}
		],
		"sources": [
			{
				"document_name": "document1.pdf",
				"page": 1,
				"content": "Relevant excerpt...",
				"similarity_score": 0.85
			}
		]
	}
}
```

**Error Codes:**

- `PROJECT_NOT_FOUND`: Project doesn't exist
- `WORKFLOW_EXECUTION_ERROR`: AI workflow failed
- `PROJECT_QUERY_ERROR`: Query processing failed

---

### Public Endpoints (`/api/open`)

#### Health Check

**GET** `/api/open/health`

Check API and database health status.

**Response:**

```json
{
	"success": true,
	"message": "API and database are healthy",
	"data": {
		"status": "healthy",
		"database": "connected",
		"version": "1.0.0"
	}
}
```

**Error Response (503):**

```json
{
	"success": false,
	"message": "Database connection failed",
	"error_code": "DB_DISCONNECTED",
	"details": "API is running but database is not connected"
}
```

#### Root

**GET** `/api/open/root`

Basic API status endpoint.

**Response:**

```json
{
	"success": true,
	"message": "CogniFlow API is running",
	"data": {
		"version": "1.0.0",
		"status": "healthy"
	}
}
```

## 🚨 Error Codes Reference

### Authentication Errors

- `EMAIL_EXISTS`: Email already registered
- `USER_NOT_FOUND`: User doesn't exist
- `INVALID_CREDENTIALS`: Wrong password
- `NOT_AUTHENTICATED`: Invalid or missing token
- `TOKEN_EXPIRED`: JWT token has expired

### Project Errors

- `PROJECT_NOT_FOUND`: Project doesn't exist or user doesn't have access
- `PROJECT_ACCESS_ERROR`: Insufficient permissions
- `PROJECT_CREATION_ERROR`: Failed to create project
- `PROJECT_UPDATE_ERROR`: Failed to update project
- `PROJECT_DELETION_ERROR`: Failed to delete project
- `PROJECT_QUERY_ERROR`: Failed to process query

### Validation Errors

- `VALIDATION_ERROR`: Request validation failed
- `FILE_PROCESSING_ERROR`: Failed to process uploaded files
- `WORKFLOW_EXECUTION_ERROR`: AI workflow execution failed

### System Errors

- `INTERNAL_SERVER_ERROR`: Unexpected server error
- `DB_DISCONNECTED`: Database connection failed

## 📝 Usage Examples

### Complete Authentication Flow

```bash
# 1. Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# 2. Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# 3. Use token for authenticated requests
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Project Management Flow

```bash
# 1. Create project with documents
curl -X POST http://localhost:8000/api/projects \
  -H "Authorization: Bearer <token>" \
  -F "name=Research Project" \
  -F "description=AI research documents" \
  -F "pdf_files=@paper1.pdf" \
  -F "pdf_files=@paper2.pdf"

# 2. Query the project
curl -X POST http://localhost:8000/api/projects/{project_id}/query \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "Summarize the key findings", "include_conversation_history": true}'

# 3. Update project
curl -X PUT http://localhost:8000/api/projects/{project_id} \
  -H "Authorization: Bearer <token>" \
  -F "description=Updated description" \
  -F "pdf_files=@additional_paper.pdf"
```

## 🔧 Configuration

### Node Configurations

#### LLM Node Configuration

```json
{
	"openai_api_key": "sk-...",
	"llm_model_name": "gpt-4"
}
```

#### Knowledge Base Node Configuration

```json
{
	"openai_api_key": "sk-...",
	"embedding_model_name": "text-embedding-ada-002"
}
```

#### Web Search Node Configuration

```json
{
	"serpapi_api_key": "your-serpapi-key"
}
```

## 🏗️ Workflow Types

The system supports different workflow configurations:

1. **`kb_llm`**: Query documents only using RAG (Retrieval Augmented Generation)
2. **`web_llm`**: Search web only for information
3. **`kb_web_llm`**: Combine document search with web search
4. **`llm_only`**: Direct LLM query without additional context

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check JWT token format and expiration
2. **403 Forbidden**: User doesn't have access to resource
3. **404 Not Found**: Check endpoint URL and resource ID
4. **413 Payload Too Large**: File size exceeds limit (10MB per file)
5. **503 Service Unavailable**: Database connection issues

### Debug Mode

Enable debug mode for detailed error information:

```env
DEBUG=true
```
