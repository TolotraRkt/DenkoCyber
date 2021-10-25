"""Station routes: list, create, update, delete and seed the café's computers."""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as OrmSession

from ..database import get_db
from ..deps import get_current_active_user
from ..models import Session, Station, User
from ..schemas import (
    SessionRead,
    StationCreate,
    StationLive,
    StationRead,
    StationUpdate,
    StationsLiveList,
)
from ..session_logic import active_session_for_station, remaining_seconds

router = APIRouter(prefix="/api/stations", tags=["stations"])

# Default stations created by the seed endpoint.
DEFAULT_STATIONS = [
    ("PC-01", "Bureautique", 30.0),
    ("PC-02", "Bureautique", 30.0),
    ("PC-03", "Bureautique", 30.0),
    ("PC-04", "Bureautique", 30.0),
    ("PC-05", "Gaming", 50.0),
    ("PC-06", "Gaming", 50.0),
    ("PC-07", "Gaming", 50.0),
    ("PC-08", "Gaming", 50.0),
]


def _get_station_or_404(db: OrmSession, station_id: int) -> Station:
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ce poste n'existe pas.",
        )
    return station


@router.get("", response_model=List[StationRead])
def list_stations(
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
) -> List[Station]:
    return db.query(Station).order_by(Station.code).all()


@router.get("/live", response_model=StationsLiveList)
def stations_live(
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
) -> StationsLiveList:
    """Live state of every station in a single call.

    Replaces N per-station requests on the operator screen. Expires any
    running session whose time is up before reporting, so the statuses and
    remaining times are always fresh.
    """
    now = datetime.utcnow()
    items: List[StationLive] = []
    for station in db.query(Station).order_by(Station.code).all():
        session = active_session_for_station(db, station.code)
        # active_session_for_station may expire a session and free the station,
        # which commits a new status. Refresh so we never report a stale "busy"
        # station with no session.
        db.refresh(station)
        items.append(
            StationLive(
                station=StationRead.from_orm(station),
                session=SessionRead.from_orm(session) if session is not None else None,
                remaining_seconds=remaining_seconds(session, now) if session is not None else None,
            )
        )
    return StationsLiveList(stations=items, server_time=now)


@router.post("", response_model=StationRead, status_code=status.HTTP_201_CREATED)
def create_station(
    payload: StationCreate,
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
) -> Station:
    existing = db.query(Station).filter(Station.code == payload.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un poste avec ce code existe déjà.",
        )
    station = Station(
        code=payload.code,
        name=payload.name,
        rate_per_minute=payload.rate_per_minute,
        ip_address=payload.ip_address,
        status="free",
    )
    db.add(station)
    db.commit()
    db.refresh(station)
    return station


@router.get("/{station_id}", response_model=StationRead)
def read_station(
    station_id: int,
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
) -> Station:
    return _get_station_or_404(db, station_id)


@router.patch("/{station_id}", response_model=StationRead)
def update_station(
    station_id: int,
    payload: StationUpdate,
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
) -> Station:
    station = _get_station_or_404(db, station_id)
    # Only overwrite fields explicitly provided in the request.
    data = payload.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(station, field, value)
    db.commit()
    db.refresh(station)
    return station


@router.delete("/{station_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_station(
    station_id: int,
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
) -> None:
    station = _get_station_or_404(db, station_id)
    db.delete(station)
    db.commit()


@router.post("/seed", response_model=List[StationRead], status_code=status.HTTP_201_CREATED)
def seed_stations(
    db: OrmSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
) -> List[Station]:
    """Create the default set of stations if the table is empty.

    Idempotent: does nothing (and returns the existing rows) when stations
    already exist, so it is safe to call from the frontend on first run.
    """
    if db.query(Station).count() == 0:
        for code, name, rate in DEFAULT_STATIONS:
            db.add(Station(code=code, name=name, rate_per_minute=rate, status="free"))
        db.commit()
    return db.query(Station).order_by(Station.code).all()


@router.get("/by-code/{code}/live", response_model=StationLive)
def station_live_by_code(
    code: str,
    db: OrmSession = Depends(get_db),
) -> StationLive:
    """Live state of a station identified by its code (e.g. "PC-01").

    Public endpoint (no token): polled by the client app running on the station
    to know whether it is busy, which code is active and how many seconds
    remain. Expires the running session automatically when its time is up.
    """
    station = db.query(Station).filter(Station.code == code.upper()).first()
    if station is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ce poste n'existe pas.",
        )
    session = active_session_for_station(db, station.code)
    return StationLive(
        station=StationRead.from_orm(station),
        session=SessionRead.from_orm(session) if session is not None else None,
        remaining_seconds=remaining_seconds(session) if session is not None else None,
    )
