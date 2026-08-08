from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class PolicyViolationBase(SQLModel):
    pipeline_run_id: int = Field(foreign_key="pipeline_runs.id", index=True)
    policy_rule_id: Optional[int] = Field(default=None, foreign_key="policy_rules.id")
    violation_detail: str

class PolicyViolation(PolicyViolationBase, table=True):
    __tablename__ = "policy_violations"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    pipeline_run: Optional["PipelineRun"] = Relationship(back_populates="policy_violations")
    policy_rule: Optional["PolicyRule"] = Relationship(back_populates="violations")

class PolicyViolationCreate(PolicyViolationBase):
    pass

class PolicyViolationRead(PolicyViolationBase):
    id: int
    created_at: datetime
