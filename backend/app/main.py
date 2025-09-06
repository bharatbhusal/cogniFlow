from fastapi import FastAPI
from app.api import auth, workflow, task, ai

app = FastAPI(title="CogniFlow API")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(workflow.router, prefix="/api/workflows", tags=["workflows"])
app.include_router(task.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
