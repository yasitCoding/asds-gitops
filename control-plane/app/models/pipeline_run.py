from datetime import datetime, timezone
from typing import Optional, List, Any, Dict
from sqlmodel import SQLModel, Field, Relationship, Column, JSON

class PipelineRunBase(SQLModel):
    repository_id: int = Field(foreign_key="repositories.id", index=True)
    commit_hash: str = Field(max_length=40)
    status: str = Field(default="pending", max_length=20)
    image_tag: str = Field(max_length=50)
    test_status: Optional[str] = Field(default=None, max_length=20)
    test_output: Optional[str] = Field(default=None)
    scan_summary: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

class PipelineRun(PipelineRunBase, table=True):
    __tablename__ = "pipeline_runs"

    id: Optional[int] = Field(default=None, primary_key=True)
    triggered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    repository: Optional["Repository"] = Relationship(back_populates="pipeline_runs")
    scan_results: List["ScanResult"] = Relationship(back_populates="pipeline_run")
    policy_violations: List["PolicyViolation"] = Relationship(back_populates="pipeline_run")
    deployment: Optional["Deployment"] = Relationship(back_populates="pipeline_run")
    notifications_log: List["NotificationLog"] = Relationship(back_populates="pipeline_run")

class PipelineRunCreate(PipelineRunBase):
    pass

class PipelineRunRead(PipelineRunBase):
    id: int
    triggered_at: datetime
