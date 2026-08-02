from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class ScanResultBase(SQLModel):
    pipeline_run_id: int = Field(foreign_key="pipeline_runs.id", index=True)
    scanner_name: str = Field(default="Trivy", max_length=50)
    severity: str = Field(max_length=20)
    cve_id: str = Field(max_length=50)
    package_name: str = Field(max_length=100)
    installed_version: Optional[str] = Field(default=None, max_length=50)
    fixed_version: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = Field(default=None)

class ScanResult(ScanResultBase, table=True):
    __tablename__ = "scan_results"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Relationship
    pipeline_run: Optional["PipelineRun"] = Relationship(back_populates="scan_results")

class ScanResultCreate(ScanResultBase):
    pass

class ScanResultRead(ScanResultBase):
    id: int
