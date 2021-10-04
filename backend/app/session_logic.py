"""Shared business logic for sessions and their impact on stations.

Keeping this in one place ensures the REST router and any future code agree
on how ``ends_at``, expiry and station status are derived.
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple

from sqlalchemy.orm import Session as OrmSession

from .models import Session, Station

# Statuses a session can go through.
SESSION_PENDING = "pending"
SESSION_RUNNING = "running"
SESSION_DONE = "done"
SESSION_EXPIRED = "expired"

STATION_FREE = "free"
STATION_BUSY = "busy"
STATION_OFFLINE = "offline"


def compute_ends_at(started_at: datetime, minutes: float) -> datetime:
    """Return the planned end datetime for a session starting at ``started_at``."""
    return started_at + timedelta(minutes=minutes)


def remaining_seconds(session: Session, now: Optional[datetime] = None) -> Optional[int]:
    """Seconds left before the session expires, or None if it is not running."""
    if session.status != SESSION_RUNNING or session.ends_at is None:
        return None
    now = now or datetime.utcnow()
    delta = (session.ends_at - now).total_seconds()
    return max(0, int(delta))


def expire_if_due(db: OrmSession, session: Session, now: Optional[datetime] = None) -> bool:
    """Mark ``session`` as expired and free its station if the time is up.

    Returns True when the session was expired by this call.
    """
    now = now or datetime.utcnow()
    if session.status != SESSION_RUNNING or session.ends_at is None:
        return False
    if session.ends_at > now:
        return False

    session.status = SESSION_EXPIRED
    session.ended_at = now
    free_station(db, session.station_id)
    db.commit()
    db.refresh(session)
    return True


def set_station_status(db: OrmSession, station_code: str, status: str) -> Optional[Station]:
    """Update a station's status by its code. Returns the station or None."""
    station = db.query(Station).filter(Station.code == station_code).first()
    if station is not None:
        station.status = status
    return station


def free_station(db: OrmSession, station_code: str) -> Optional[Station]:
    """Mark a station as free (does not commit)."""
    return set_station_status(db, station_code, STATION_FREE)


def busy_station(db: OrmSession, station_code: str) -> Optional[Station]:
    """Mark a station as busy (does not commit)."""
    return set_station_status(db, station_code, STATION_BUSY)


def active_session_for_station(db: OrmSession, station_code: str) -> Optional[Session]:
    """Return the running session on a station, expiring it first if due."""
    session = (
        db.query(Session)
        .filter(Session.station_id == station_code, Session.status == SESSION_RUNNING)
        .order_by(Session.started_at.desc())
        .first()
    )
    if session is None:
        return None
    if expire_if_due(db, session):
        return None
    return session


def claim_session(
    db: OrmSession, code: str, station_code: str
) -> Tuple[Optional[Session], Optional[str]]:
    """Start a pending session identified by ``code`` on ``station_code``.

    Returns ``(session, None)`` on success, or ``(None, error_message)``.
    Does not commit: the caller is responsible for committing.
    """
    station = db.query(Station).filter(Station.code == station_code).first()
    if station is None:
        return None, "Ce poste n'existe pas."
    if station.status != STATION_FREE:
        return None, "Ce poste est déjà occupé."

    session = db.query(Session).filter(Session.code == code).first()
    if session is None:
        return None, "Aucune session ne correspond à ce code."
    if session.status != SESSION_PENDING:
        return None, "Ce code a déjà été utilisé ou a expiré."
    if session.station_id not in (station_code, "N/A"):
        return None, "Ce code est prévu pour un autre poste."

    now = datetime.utcnow()
    session.status = SESSION_RUNNING
    session.started_at = now
    session.ends_at = compute_ends_at(now, session.minutes)
    # If the operator did not pin a station, adopt the one claiming the code.
    session.station_id = station_code
    station.status = STATION_BUSY
    return session, None
