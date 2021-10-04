"""Session routes: create, list, read, claim, start, stop, live state, stats."""
import secrets
from datetime import datetime, time, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session as OrmSession

from ..database import get_db
from ..deps import get_current_active_user
from ..models import Session, Station, User
from ..schemas import (
    DashboardStats,
    SessionClaim,
    SessionCreate,
    SessionRead,
    SessionsPage,
    StationLive,
    StationRead,
)
from ..session_logic import (
    SESSION_RUNNING,
    SESSION_PENDING,
    active_session_for_station,
    busy_station,
    claim_session,
    compute_ends_at,
    expire_if_due,
    free_station,
    remaining_seconds,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Same alphabet as the frontend: no ambiguous characters (O/0, I/1).
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 4


def _generate_unique_code(db: OrmSession) -> str:
    """Generate a 4-character code that is not already used by another session."""
    for _ in range(100):
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
        exists = db.query(Session.id).filter(Session.code == code).first()
        if not exists:
            return code
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Impossible de générer un code unique. Réessayez plus tard.",
    )


def _get_session_or_404(db: OrmSession, code: str) -> Session:
    session = db.query(Session).filter(Session.code == code).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune session ne correspond à ce code.",
        )
    return session


@router.post("", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: SessionCreate,
    db: OrmSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Session:
    session = Session(
        code=_generate_unique_code(db),
        station_id=payload.station_id,
        minutes=payload.minutes,
        amount=payload.amount,
        rate_per_minute=payload.rate_per_minute,
        status="pending",
        user_id=current_user.id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=List[SessionRead])
def list_sessions(
    db: OrmSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[Session]:
    return (
        db.query(Session)
        .filter(Session.user_id == current_user.id)
        .order_by(Session.created_at.desc())
        .all()
    )


@router.get("/history", response_model=SessionsPage)
def session_history(
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    date: Optional[str] = Query(default=None, description="Filtre sur la date (YYYY-MM-DD)"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> SessionsPage:
    """Paginated session history with optional status and date filters.

    ``status`` accepts one of pending/running/done/expired. ``date`` filters
    on the creation day (UTC). ``total`` and ``total_amount`` reflect the
    filtered set, not just the returned page.
    """
    query = db.query(Session)

    if status_filter:
        query = query.filter(Session.status == status_filter)

    if date:
        try:
            day = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Format de date invalide (attendu AAAA-MM-JJ).",
            )
        day_start = datetime.combine(day.date(), time.min)
        day_end = day_start + timedelta(days=1)
        query = query.filter(Session.created_at >= day_start, Session.created_at < day_end)

    total = query.count()
    total_amount = (
        query.with_entities(func.coalesce(func.sum(Session.amount), 0.0)).scalar() or 0.0
    )
    items = (
        query.order_by(Session.created_at.desc()).offset(offset).limit(limit).all()
    )

    return SessionsPage(
        items=[SessionRead.from_orm(s) for s in items],
        total=total,
        total_amount=round(float(total_amount), 2),
    )


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
) -> DashboardStats:
    """Aggregated figures for the operator dashboard.

    Revenue counts sessions that ended today (done or expired). Running
    sessions whose time is up are expired first so the numbers stay accurate.
    """
    now = datetime.utcnow()
    today_start = datetime.combine(now.date(), time.min)

    # Expire any running session that is past due before counting.
    running = db.query(Session).filter(Session.status == SESSION_RUNNING).all()
    for session in running:
        expire_if_due(db, session, now)

    total = db.query(func.count(Station.id)).scalar() or 0
    free = db.query(func.count(Station.id)).filter(Station.status == "free").scalar() or 0
    busy = db.query(func.count(Station.id)).filter(Station.status == "busy").scalar() or 0
    offline = db.query(func.count(Station.id)).filter(Station.status == "offline").scalar() or 0

    running_count = (
        db.query(func.count(Session.id)).filter(Session.status == SESSION_RUNNING).scalar() or 0
    )
    today_count = (
        db.query(func.count(Session.id)).filter(Session.created_at >= today_start).scalar() or 0
    )
    revenue_today = (
        db.query(func.coalesce(func.sum(Session.amount), 0.0))
        .filter(Session.created_at >= today_start)
        .filter(Session.status.in_(["done", "expired"]))
        .scalar()
        or 0.0
    )

    return DashboardStats(
        stations_total=total,
        stations_free=free,
        stations_busy=busy,
        stations_offline=offline,
        sessions_running=running_count,
        sessions_today=today_count,
        revenue_today=round(float(revenue_today), 2),
        server_time=now,
    )


@router.get("/{code}", response_model=SessionRead)
def read_session(
    code: str,
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
) -> Session:
    return _get_session_or_404(db, code.upper())


@router.post("/{code}/start", response_model=SessionRead)
def start_session(
    code: str,
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
) -> Session:
    session = _get_session_or_404(db, code.upper())
    if session.status != SESSION_PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette session ne peut pas être démarrée (statut : {}).".format(session.status),
        )
    now = datetime.utcnow()
    session.status = SESSION_RUNNING
    session.started_at = now
    session.ends_at = compute_ends_at(now, session.minutes)
    busy_station(db, session.station_id)
    db.commit()
    db.refresh(session)
    return session


@router.post("/{code}/stop", response_model=SessionRead)
def stop_session(
    code: str,
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
) -> Session:
    session = _get_session_or_404(db, code.upper())
    if session.status != SESSION_RUNNING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette session n'est pas en cours (statut : {}).".format(session.status),
        )
    session.status = "done"
    session.ended_at = datetime.utcnow()
    free_station(db, session.station_id)
    db.commit()
    db.refresh(session)
    return session


@router.post("/claim", response_model=SessionRead)
def claim(
    payload: SessionClaim,
    db: OrmSession = Depends(get_db),
) -> Session:
    """Start a pending session from a station app using its 4-character code.

    Public endpoint (no token): the 4-character code acts as the secret, which
    is what the client types on the station. Also marks the station as busy and
    computes the planned end time.
    """
    session, error = claim_session(db, payload.code.upper(), payload.station_id)
    if error is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=error)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{code}/live", response_model=StationLive)
def session_live(
    code: str,
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
) -> StationLive:
    """Live state of the station hosting the given session code.

    Expires the session automatically when its time is up.
    """
    session = _get_session_or_404(db, code.upper())
    expire_if_due(db, session)
    station = db.query(Station).filter(Station.code == session.station_id).first()
    if station is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Le poste de cette session n'existe plus.",
        )
    return StationLive(
        station=StationRead.from_orm(station),
        session=SessionRead.from_orm(session),
        remaining_seconds=remaining_seconds(session),
    )
