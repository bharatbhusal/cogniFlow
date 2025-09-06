from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, workflow, task, ai
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="CogniFlow API",
    description="AI-driven workflow automation platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(workflow.router, prefix="/api/workflows", tags=["workflows"])
app.include_router(task.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])

@app.get("/")
async def root():
    return {"message": "CogniFlow API is running", "version": "1.0.0"}
