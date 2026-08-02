import os
from typing import Generator
from sqlmodel import create_engine, Session

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set. Check your .env file.")


engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

def get_session() -> Generator[Session, None, None]:
    """FastAPI Dependency for database session."""
    with Session(engine) as session:
        yield session
