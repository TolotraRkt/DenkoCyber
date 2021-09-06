"""DenkoCyber API entrypoint (FastAPI + SQLite).

This module is PyInstaller-friendly: it exposes `app` and `run()`
so the future .exe can simply call `run()`.
"""
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import auth

app = FastAPI(title=settings.app_name, debug=settings.debug, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.on_event("startup")
def on_startup() -> None:
    # Create SQLite tables on startup
    init_db()


@app.get("/api/health", tags=["system"])
def health() -> Dict[str, str]:
    return {"status": "ok", "app": settings.app_name}


def run() -> None:
    """Entrypoint used by both `python -m app.main` and the PyInstaller .exe."""
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)


if __name__ == "__main__":
    run()
