from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class RepositoryBase(SQLModel):
    repo_url: str = Field(max_length=255)
    repo_name: str = Field(max_length=100)
    image_name: str = Field(max_length=100)
    namespace: str = Field(max_length=50)
    branch: str = Field(default="main", max_length=50)
    test_command: Optional[str] = Field(default=None, max_length=255)
    webhook_secret: str = Field(max_length=100)

class Repository(RepositoryBase, table=True):
    __tablename__ = "repositories"

    id: Optional[int] = Field(default=None, primary_key=True)
    registered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    pipeline_runs: List["PipelineRun"] = Relationship(back_populates="repository")

class RepositoryCreate(RepositoryBase):
    pass

class RepositoryRead(RepositoryBase):
    id: int
    registered_at: datetime
