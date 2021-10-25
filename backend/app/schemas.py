"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRead(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None


class SessionCreate(BaseModel):
    station_id: str = Field(min_length=1, max_length=20)
    minutes: float = Field(gt=0)
    amount: float = Field(gt=0)
    rate_per_minute: float = Field(gt=0)


class StationBase(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: Optional[str] = Field(default=None, max_length=100)
    rate_per_minute: float = Field(gt=0)
    ip_address: Optional[str] = Field(default=None, max_length=45)


class StationCreate(StationBase):
    pass


class StationUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100)
    status: Optional[str] = Field(default=None, regex="^(free|busy|offline)$")
    rate_per_minute: Optional[float] = Field(default=None, gt=0)
    ip_address: Optional[str] = Field(default=None, max_length=45)


class StationRead(StationBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True


class SessionRead(BaseModel):
    id: int
    code: str
    station_id: str
    minutes: float
    amount: float
    rate_per_minute: float
    status: str
    created_at: datetime
    started_at: Optional[datetime]
    ends_at: Optional[datetime]
    ended_at: Optional[datetime]
    user_id: int

    class Config:
        orm_mode = True


class StationLive(BaseModel):
    """Live state of a station as seen by the client app running on it."""

    station: StationRead
    session: Optional[SessionRead] = None
    remaining_seconds: Optional[int] = None


class StationsLiveList(BaseModel):
    """All stations with their live state, in a single response."""

    stations: List[StationLive]
    server_time: datetime


class SessionClaim(BaseModel):
    """Payload sent by a station app to start a session with a code."""

    code: str = Field(min_length=4, max_length=4)
    station_id: str = Field(min_length=1, max_length=20)


class SessionExtend(BaseModel):
    """Payload to add extra minutes to a running session."""

    extra_minutes: float = Field(gt=0, le=1440)


class SessionsPage(BaseModel):
    """A page of sessions plus the total count for the current filter."""

    items: List[SessionRead]
    total: int
    total_amount: float


class DashboardStats(BaseModel):
    """Aggregated figures shown on the operator dashboard."""

    stations_total: int
    stations_free: int
    stations_busy: int
    stations_offline: int
    sessions_running: int
    sessions_today: int
    revenue_today: float
    server_time: datetime
