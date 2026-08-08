import logging
import yaml
from typing import Any, Dict, List, Literal, Optional
from fastapi import APIRouter, Header, HTTPException, Request, Depends, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import verify_github_hmac_signature
from app.services.trivy_parser import TrivyParserService
from app.services.opa_client import OPAClientService, OPAEvaluationResult
from app.services.git_service import GitManifestService
from app.services.pipeline_service import PipelineRecorderService
from app.models import PolicyRule

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/pipeline", tags=["Pipeline Webhook"])

class WebhookPayload(BaseModel):
    repository_url: str = Field(..., description="Git repository URL")
    commit_hash: str = Field(..., min_length=7, max_length=40, description="Git commit hash")
    image_tag: str = Field(..., description="Docker image tag (e.g. app:v1.0.0)")
    test_status: Literal["passed", "failed"] = Field(..., description="Unit test status")
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
    recorder = PipelineRecorderService(db_session)
    repo = recorder.get_repository_by_url(repo_url=payload.repository_url)
    if repo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository is not registered in the control plane.",
        )

    # Reject untrusted webhook data before processing it.
    raw_body = await request.body()
    if not x_hub_signature_256 or not verify_github_hmac_signature(
        raw_body=raw_body,
        secret=repo.webhook_secret,
        signature_header=x_hub_signature_256,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Hub-Signature-256 webhook signature.",
        )

    logger.info(
        "Received verified webhook for repo=%s, commit=%s, tag=%s",
        payload.repository_url,
        payload.commit_hash,
        payload.image_tag,
    )

    summary, vulnerabilities = TrivyParserService.parse_scan_report(
        pipeline_run_id=0,
        raw_report=payload.trivy_report or {}
    )

    manifest_dict: Optional[Dict[str, Any]] = None
    if payload.manifest_yaml:
        try:
            manifest_dict = yaml.safe_load(payload.manifest_yaml)
        except Exception as e:
            logger.warning(f"Failed to parse manifest_yaml: {e}")

    pipeline_run = recorder.create_pipeline_run(
        repository_id=repo.id,
        commit_hash=payload.commit_hash,
        image_tag=payload.image_tag,
        status="running",
        test_status=payload.test_status,
        test_output=payload.test_output,
        scan_summary=summary,
    )

    recorder.record_notification_log(
        pipeline_run_id=pipeline_run.id,
        message_content=f"Pipeline run #{pipeline_run.id} started for commit {payload.commit_hash[:7]}"
    )

    recorder.record_scan_results(pipeline_run.id, vulnerabilities)

    opa_service = OPAClientService()
    scan_results_dict = [v.model_dump() for v in vulnerabilities]
    enabled_rule_names = {
        "unit_test": "Unit Test Policy",
        "cve_threshold": "CVE Threshold Policy",
        "run_as_non_root": "RunAsNonRoot Policy",
        "resource_limits": "Resource Limits Policy",
        "trusted_registry": "Trusted Registry Policy",
    }
    enabled_policies = {
        package_name
        for package_name, rule_name in enabled_rule_names.items()
        if (
            db_session.exec(
                select(PolicyRule.enabled).where(PolicyRule.rule_name == rule_name)
            ).first()
            is True
        )
    }

    eval_result: OPAEvaluationResult = await opa_service.evaluate_all_policies(
        test_status=payload.test_status,
        scan_results=scan_results_dict,
        manifest_data=manifest_dict,
        enabled_policies=enabled_policies,
    )

    if not eval_result.is_allowed:
        recorder.record_policy_violations(pipeline_run.id, eval_result.violation_details)
        pipeline_run.status = eval_result.status_code
        db_session.add(pipeline_run)
        db_session.commit()

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

    git_service = GitManifestService()
    git_success = await git_service.update_manifest_image_tag(
        image_name=repo.image_name,
        new_image_tag=payload.image_tag,
        commit_hash=payload.commit_hash,
    )

    if not git_success:
        pipeline_run.status = "failed"
        db_session.add(pipeline_run)
        db_session.commit()
        recorder.record_notification_log(
            pipeline_run_id=pipeline_run.id,
            message_content=(
                f"Pipeline run #{pipeline_run.id} failed while updating the GitOps manifest."
            ),
        )
        return WebhookResponse(
            status="failed",
            pipeline_run_id=pipeline_run.id,
            message="Policy evaluation passed, but the GitOps manifest update failed.",
            violations=[],
        )

    # ArgoCD confirmation is a separate event; this webhook only proves policy
    # evaluation and manifest push succeeded.
    final_status = "passed"
    pipeline_run.status = final_status
    db_session.add(pipeline_run)
    db_session.commit()

    recorder.record_notification_log(
        pipeline_run_id=pipeline_run.id,
        message_content=(
            f"Pipeline run #{pipeline_run.id} passed all policy checks and pushed "
            "the manifest; awaiting ArgoCD confirmation."
        ),
    )

    return WebhookResponse(
        status=final_status,
        pipeline_run_id=pipeline_run.id,
        message=f"Pipeline evaluated successfully and marked as '{final_status}'",
        violations=[],
    )
