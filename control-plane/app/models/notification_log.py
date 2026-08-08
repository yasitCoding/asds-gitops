from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class NotificationLogBase(SQLModel):
    pipeline_run_id: int = Field(foreign_key="pipeline_runs.id", index=True)
    channel: str = Field(default="Web Dashboard", max_length=50)
    message_content: str

class NotificationLog(NotificationLogBase, table=True):
    __tablename__ = "notifications_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    pipeline_run: Optional["PipelineRun"] = Relationship(back_populates="notifications_log")

class NotificationLogCreate(NotificationLogBase):
    pass

class NotificationLogRead(NotificationLogBase):
    id: int
    sent_at: datetime
