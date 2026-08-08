from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class DeploymentBase(SQLModel):
    pipeline_run_id: int = Field(foreign_key="pipeline_runs.id", index=True)
    argocd_app_name: str = Field(max_length=100)
    deployment_status: str = Field(max_length=20)
    cluster_namespace: str = Field(max_length=50)

class Deployment(DeploymentBase, table=True):
    __tablename__ = "deployments"

    id: Optional[int] = Field(default=None, primary_key=True)
    deployed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    pipeline_run: Optional["PipelineRun"] = Relationship(back_populates="deployment")

class DeploymentCreate(DeploymentBase):
    pass

class DeploymentRead(DeploymentBase):
    id: int
    deployed_at: datetime
