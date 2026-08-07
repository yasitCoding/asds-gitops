import os
import logging
from datetime import datetime, timezone
import httpx
from typing import Any

from fastapi import APIRouter, Depends, Response, status
from sqlmodel import Session, text

from app.core.database import get_session

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health Check"])

@router.get(
    "/health",
    summary="Health check endpoint for Docker container & monitoring"
)
async def health_check(
    response: Response,
    db_session: Session = Depends(get_session)
) -> dict[str, Any]:
    """
    Checks status of Control Plane Gateway, Database connection, and OPA Engine.
    Returns HTTP 200 OK if healthy, HTTP 503 if any core dependency fails.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": "unknown",
            "opa_engine": "unknown",
        }
    }
    is_healthy = True

    # 1. Test PostgreSQL DB Connectivity
    try:
        db_session.exec(text("SELECT 1"))
        health_status["services"]["database"] = "connected"
    except Exception:
        logger.exception("Health check failed - Database error")
        health_status["services"]["database"] = "unreachable"
        is_healthy = False

    # 2. Test OPA Engine Connectivity
    opa_url = os.getenv("OPA_URL", "http://localhost:8181/v1/data").rstrip("/")
    # Convert OPA data URL to base URL for health check
    opa_health_url = opa_url.replace("/v1/data", "") + "/health"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            opa_resp = await client.get(opa_health_url)
            if opa_resp.status_code == 200:
                health_status["services"]["opa_engine"] = "connected"
            else:
                health_status["services"]["opa_engine"] = f"degraded (HTTP {opa_resp.status_code})"
                is_healthy = False
    except Exception:
        logger.exception("Health check warning - OPA Engine error")
        health_status["services"]["opa_engine"] = "unreachable"
        is_healthy = False

    if not is_healthy:
        health_status["status"] = "degraded"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return health_status
