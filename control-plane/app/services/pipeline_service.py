import logging
from typing import Any, Dict, List, Optional
from sqlmodel import Session, select

from app.models import (
    Repository,
    PipelineRun,
    PipelineRunCreate,
    ScanResult,
    ScanResultCreate,
    PolicyRule,
    PolicyViolation,
    PolicyViolationCreate,
    Deployment,
    DeploymentCreate,
    NotificationLog,
)

logger = logging.getLogger(__name__)

class PipelineRecorderService:
    """Service to record Pipeline Runs, Scan Results, Violations, and Deployments to PostgreSQL."""

    def __init__(self, session: Session):
        self.session = session

    def get_or_create_repository(
        self,
        repo_url: str,
        image_name: str = "app",
        namespace: str = "default",
        branch: str = "main",
        webhook_secret: str = "default-secret"
    ) -> Repository:
        """Finds existing repository by URL or creates a new registration."""
        statement = select(Repository).where(Repository.repo_url == repo_url)
        repo = self.session.exec(statement).first()
        if not repo:
            repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
            repo = Repository(
                repo_url=repo_url,
                repo_name=repo_name,
                image_name=image_name,
                namespace=namespace,
                branch=branch,
                webhook_secret=webhook_secret,
            )
            self.session.add(repo)
            self.session.commit()
            self.session.refresh(repo)
        return repo

    def create_pipeline_run(
        self,
        repository_id: int,
        commit_hash: str,
        image_tag: str,
        status: str = "pending",
        test_status: Optional[str] = None,
        test_output: Optional[str] = None,
        scan_summary: Optional[Dict[str, Any]] = None,
    ) -> PipelineRun:
        """Creates a new pipeline_run database record."""
        pipeline_run = PipelineRun(
            repository_id=repository_id,
            commit_hash=commit_hash,
            image_tag=image_tag,
            status=status,
            test_status=test_status,
            test_output=test_output,
            scan_summary=scan_summary,
        )
        self.session.add(pipeline_run)
        self.session.commit()
        self.session.refresh(pipeline_run)
        return pipeline_run

    def record_scan_results(
        self,
        pipeline_run_id: int,
        scan_results: List[ScanResultCreate]
    ) -> int:
        """Inserts vulnerability scan results into scan_results table."""
        count = 0
        for item in scan_results:
            db_item = ScanResult(
                pipeline_run_id=pipeline_run_id,
                scanner_name=item.scanner_name,
                severity=item.severity,
                cve_id=item.cve_id,
                package_name=item.package_name,
                installed_version=item.installed_version,
                fixed_version=item.fixed_version,
                description=item.description,
            )
            self.session.add(db_item)
            count += 1
        self.session.commit()
        return count

    def record_policy_violations(
        self,
        pipeline_run_id: int,
        violation_details: List[Dict[str, Any]]
    ) -> int:
        """Inserts policy violations into policy_violations table."""
        count = 0
        for item in violation_details:
            policy_name = item.get("policy", "")
            detail = item.get("detail", "Policy check failed")

            # Match policy rule ID if exists
            rule_statement = select(PolicyRule).where(PolicyRule.rule_name.ilike(f"%{policy_name}%"))
            policy_rule = self.session.exec(rule_statement).first()
            rule_id = policy_rule.id if policy_rule else None

            violation_record = PolicyViolation(
                pipeline_run_id=pipeline_run_id,
                policy_rule_id=rule_id,
                violation_detail=detail,
            )
            self.session.add(violation_record)
            count += 1

        self.session.commit()
        return count

    def record_deployment(
        self,
        pipeline_run_id: int,
        argocd_app_name: str,
        cluster_namespace: str = "default",
        deployment_status: str = "synced"
    ) -> Deployment:
        """Inserts a deployment record into deployments table."""
        deployment = Deployment(
            pipeline_run_id=pipeline_run_id,
            argocd_app_name=argocd_app_name,
            cluster_namespace=cluster_namespace,
            deployment_status=deployment_status,
        )
        self.session.add(deployment)
        self.session.commit()
        self.session.refresh(deployment)
        return deployment

    def record_notification_log(
        self,
        pipeline_run_id: int,
        message_content: str,
        channel: str = "Web Dashboard"
    ) -> NotificationLog:
        """Inserts a notification record into notifications_log table whenever status changes."""
        notification = NotificationLog(
            pipeline_run_id=pipeline_run_id,
            channel=channel,
            message_content=message_content,
        )
        self.session.add(notification)
        self.session.commit()
        self.session.refresh(notification)
        return notification
