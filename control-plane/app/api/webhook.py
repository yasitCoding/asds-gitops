import os
import logging
import yaml
from typing import Any, Dict, Optional, List
from fastapi import APIRouter, Header, HTTPException, Request, Depends, status
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import verify_github_hmac_signature
from app.services.trivy_parser import TrivyParserService
from app.services.opa_client import OPAClientService, OPAEvaluationResult
from app.services.git_service import GitManifestService
from app.services.pipeline_service import PipelineRecorderService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/pipeline", tags=["Pipeline Webhook"])

class WebhookPayload(BaseModel):
    repository_url: str = Field(..., description="Git repository URL")
    commit_hash: str = Field(..., min_length=7, max_length=40, description="Git commit hash")
    image_tag: str = Field(..., description="Docker image tag (e.g. app:v1.0.0)")
    test_status: Optional[str] = Field(default="passed", description="Unit test status: passed or failed")
    test_output: Optional[str] = Field(default=None, description="Raw test output log")
    trivy_report: Optional[Dict[str, Any]] = Field(default=None, description="Trivy vulnerability scan report JSON")
    manifest_yaml: Optional[str] = Field(default=None, description="Kubernetes deployment manifest YAML string")

class WebhookResponse(BaseModel):
    status: str
    pipeline_run_id: Optional[int] = None
    message: str
    violations: List[str] = []

@router.post(
    "/webhook",
    response_model=WebhookResponse,
    status_code=status.HTTP_200_OK,
    summary="Receive pipeline webhook from GitHub Actions"
)
async def receive_pipeline_webhook(
    request: Request,
    payload: WebhookPayload,
    db_session: Session = Depends(get_session),
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256")
) -> WebhookResponse:
    """
    Webhook endpoint to receive test results, Trivy scan report, and Kubernetes Manifest.
    Verifies HMAC Signature (X-Hub-Signature-256), evaluates OPA rules, and records audit trail & notification log to Database.
    """
    logger.info(f"Received webhook for repo={payload.repository_url}, commit={payload.commit_hash}, tag={payload.image_tag}")

    recorder = PipelineRecorderService(db_session)
    repo = recorder.get_or_create_repository(repo_url=payload.repository_url)

    # 1. Verify HMAC Signature (Security Gate)
    webhook_secret = os.getenv("WEBHOOK_SECRET") or repo.webhook_secret
    if x_hub_signature_256 and webhook_secret and webhook_secret != "your-webhook-secret-key":
        raw_body = await request.body()
        is_valid_sig = verify_github_hmac_signature(
            raw_body=raw_body,
            secret=webhook_secret,
            signature_header=x_hub_signature_256
        )
        if not is_valid_sig:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid X-Hub-Signature-256 webhook signature. Access denied."
            )

    # 2. Parse Trivy Scan Report
    summary, vulnerabilities = TrivyParserService.parse_scan_report(
        pipeline_run_id=0,
        raw_report=payload.trivy_report or {}
    )

    # 3. Parse Manifest YAML
    manifest_dict: Optional[Dict[str, Any]] = None
    if payload.manifest_yaml:
        try:
            manifest_dict = yaml.safe_load(payload.manifest_yaml)
        except Exception as e:
            logger.warning(f"Failed to parse manifest_yaml: {e}")

    # 4. Create Pipeline Run DB Record (Running)
    pipeline_run = recorder.create_pipeline_run(
        repository_id=repo.id,
        commit_hash=payload.commit_hash,
        image_tag=payload.image_tag,
        status="running",
        test_status=payload.test_status,
        test_output=payload.test_output,
        scan_summary=summary,
    )

    # Log Notification: Pipeline Started
    recorder.record_notification_log(
        pipeline_run_id=pipeline_run.id,
        message_content=f"Pipeline run #{pipeline_run.id} started for commit {payload.commit_hash[:7]}"
    )

    # Record scan results in DB
    recorder.record_scan_results(pipeline_run.id, vulnerabilities)

    # 5. Evaluate via OPA Client
    opa_service = OPAClientService()
    scan_results_dict = [v.model_dump() for v in vulnerabilities]

    eval_result: OPAEvaluationResult = await opa_service.evaluate_all_policies(
        test_status=payload.test_status,
        scan_results=scan_results_dict,
        manifest_data=manifest_dict
    )

    # 6. Handle Execution Decision (Passed vs Failed)
    if not eval_result.is_allowed:
        # Record Violations & Update Pipeline Status
        recorder.record_policy_violations(pipeline_run.id, eval_result.violation_details)
        pipeline_run.status = eval_result.status_code
        db_session.add(pipeline_run)
        db_session.commit()

        # Log Notification: Pipeline Failed
        violation_summary = "; ".join(eval_result.violations) if eval_result.violations else "Policy check failed"
        recorder.record_notification_log(
            pipeline_run_id=pipeline_run.id,
            message_content=f"Pipeline run #{pipeline_run.id} blocked with status '{eval_result.status_code}': {violation_summary}"
        )

        return WebhookResponse(
            status=eval_result.status_code,
            pipeline_run_id=pipeline_run.id,
            message=f"Pipeline blocked: {eval_result.status_code}",
            violations=eval_result.violations,
        )

    # Passed! Execute GitOps Auto-commit & Push
    git_service = GitManifestService()
    git_success = await git_service.update_manifest_image_tag(
        image_name=repo.image_name,
        new_image_tag=payload.image_tag,
        commit_hash=payload.commit_hash,
    )

    final_status = "deployed" if git_success else "passed"
    pipeline_run.status = final_status
    db_session.add(pipeline_run)
    db_session.commit()

    if git_success:
        recorder.record_deployment(
            pipeline_run_id=pipeline_run.id,
            argocd_app_name=f"{repo.repo_name}-app",
            cluster_namespace=repo.namespace,
            deployment_status="synced",
        )

    # Log Notification: Pipeline Deployed / Passed
    recorder.record_notification_log(
        pipeline_run_id=pipeline_run.id,
        message_content=f"Pipeline run #{pipeline_run.id} passed all policy checks and was successfully marked as '{final_status}'"
    )

    return WebhookResponse(
        status=final_status,
        pipeline_run_id=pipeline_run.id,
        message=f"Pipeline evaluated successfully and marked as '{final_status}'",
        violations=[],
    )
