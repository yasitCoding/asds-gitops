import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.webhook import router as webhook_router
from app.api.health import router as health_router

app = FastAPI(
    title="Control Plane Gateway API",
    description="GitOps Delivery System Control Plane & Security Policy Evaluator",
    version="1.0.0",
)

# CORS Middleware
allowed_origins_raw = os.getenv("CORS_ALLOWED_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health_router)
app.include_router(webhook_router)

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "Control Plane Gateway",
        "status": "online",
        "health": "/health",
        "docs": "/docs"
    }
