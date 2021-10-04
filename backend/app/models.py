"""SQLAlchemy ORM models."""
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    """A paid session requested by an operator for a given station.

    Lifecycle: pending -> running -> done (or expired).
    The 4-character ``code`` is the identifier the client must provide to
    start the session on the station.
    """

    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(4), unique=True, index=True, nullable=False)
    station_id = Column(String(20), nullable=False, index=True)
    minutes = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    rate_per_minute = Column(Float, nullable=False)
    status = Column(String(20), default="pending", nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    # Planned end of the session (started_at + minutes). Computed on start.
    ends_at = Column(DateTime, nullable=True, index=True)
    ended_at = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    user = relationship("User", back_populates="sessions")


class Station(Base):
    """A physical computer in the cybercafé.

    ``code`` is the human-readable identifier (e.g. "PC-01").
    Each station has its own hourly rate so gaming rigs can be priced
    differently from basic browsing machines.
    """

    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=True)
    status = Column(String(20), default="free", nullable=False, index=True)
    rate_per_minute = Column(Float, default=30.0, nullable=False)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
