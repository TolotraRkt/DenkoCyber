"""Application configuration loaded from environment variables / defaults."""
from typing import List

from pydantic import BaseSettings


class Settings(BaseSettings):
    app_name: str = "DenkoCyber API"
    debug: bool = True

    # SQLite database (file created next to the executable when frozen)
    database_url: str = "sqlite:///./denkocyber.db"

    # JWT / auth settings
    secret_key: str = "CHANGE_ME_IN_PRODUCTION_denkocyber_secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # CORS - frontend dev server
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
