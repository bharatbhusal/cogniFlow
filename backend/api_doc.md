# CogniFlow Backend API Documentation

## Authentication

- JWT-based authentication for protected endpoints
- OAuth integration for third-party services

## Endpoints

### User

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT
- `GET /api/auth/me` - Get current user info

### Workflow

- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create a new workflow
- `GET /api/workflows/{id}` - Get workflow details
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow

### Task

- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/{id}` - Get task details
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### AI/ML Integration

- `POST /api/ai/analyze` - Submit data for AI analysis
- `GET /api/ai/results/{id}` - Get analysis results

## Request/Response Examples

```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "string"
}
```

Response:

```json
{
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

## Error Handling

- Standardized error responses with HTTP status codes
- Example:

```json
{
  "detail": "Invalid credentials"
}
```

## Environment Variables

See `.env.example` for required API keys and configuration.

## Contact

For API support, open an issue or contact the maintainer.
