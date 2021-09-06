"""Database engine, session factory and base class for SQLAlchemy models."""
import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from .config import settings


def _resolve_database_url() -> str:
    """When frozen by PyInstaller, store the DB next to the executable."""
    url = settings.database_url
    if getattr(sys, "frozen", False) and url.startswith("sqlite:///./"):
        exe_dir = Path(sys.executable).parent
        db_name = url.replace("sqlite:///./", "")
        return "sqlite:///" + (exe_dir / db_name).as_posix()
    return url


DATABASE_URL = _resolve_database_url()

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables if they do not exist. Import models first."""
    from . import models  # noqa: F401  (ensures models are registered)

    Base.metadata.create_all(bind=engine)
