import hmac
import os
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, model_validator
from sqlmodel import Session

from app.core.database import get_session
from app.models import PipelineRun
from app.services.pipeline_service import PipelineRecorderService

router = APIRouter(prefix="/api/v1/pipeline", tags=["Pipeline Deployment"])


class DeploymentCallbackPayload(BaseModel):
    pipeline_run_id: Optional[int] = None
    commit_hash: Optional[str] = None
    image_tag: Optional[str] = None
    argocd_app_name: str
    cluster_namespace: str = "default"
    deployment_status: Literal["synced", "degraded", "failed"] = "synced"

    @model_validator(mode="after")
    def validate_pipeline_reference(self) -> "DeploymentCallbackPayload":
        has_id = self.pipeline_run_id is not None
        has_identifiers = bool(self.commit_hash and self.image_tag)
        if has_id == has_identifiers:
            raise ValueError(
                "Provide either pipeline_run_id or both commit_hash and image_tag"
            )
        return self


class DeploymentCallbackResponse(BaseModel):
    status: str
    pipeline_run_id: int
    deployment_status: str
    message: str


def verify_argocd_callback_token(token: Optional[str]) -> None:
    expected = os.getenv("ARGOCD_CALLBACK_TOKEN", "")
    if (
        not expected
        or expected in {"your-argocd-callback-token", "default-secret"}
        or not token
        or not hmac.compare_digest(token, expected)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing ArgoCD callback token.",
        )


@router.post(
    "/deployed",
    response_model=DeploymentCallbackResponse,
    status_code=status.HTTP_200_OK,
)
def receive_deployment_callback(
    payload: DeploymentCallbackPayload,
    db_session: Session = Depends(get_session),
    x_argocd_callback_token: Optional[str] = Header(
        None,
        alias="X-ArgoCD-Callback-Token",
    ),
) -> DeploymentCallbackResponse:
    """Record ArgoCD's authenticated deployment result."""
    verify_argocd_callback_token(x_argocd_callback_token)

    recorder = PipelineRecorderService(db_session)
    pipeline_run = recorder.get_pipeline_run(
        pipeline_run_id=payload.pipeline_run_id,
        commit_hash=payload.commit_hash,
        image_tag=payload.image_tag,
    )
    if pipeline_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline run was not found.",
        )
    if pipeline_run.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Pipeline run has no database identifier.",
        )

    recorder.record_deployment(
        pipeline_run_id=pipeline_run.id,
        argocd_app_name=payload.argocd_app_name,
        cluster_namespace=payload.cluster_namespace,
        deployment_status=payload.deployment_status,
    )
    pipeline_run.status = (
        "deployed" if payload.deployment_status == "synced" else "failed"
    )
    db_session.add(pipeline_run)
    db_session.commit()
    recorder.record_notification_log(
        pipeline_run_id=pipeline_run.id,
        message_content=(
            f"ArgoCD application '{payload.argocd_app_name}' reported "
            f"deployment status '{payload.deployment_status}'."
        ),
    )

    return DeploymentCallbackResponse(
        status=pipeline_run.status,
        pipeline_run_id=pipeline_run.id,
        deployment_status=payload.deployment_status,
        message="Deployment result recorded successfully.",
    )
