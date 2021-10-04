"""DenkoCyber API entrypoint (FastAPI + SQLite).

This module is PyInstaller-friendly: it exposes `app` and `run()`
so the future .exe can simply call `run()`.
"""
from typing import Dict

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import init_db
from .migrations import run_migrations
from .routers import auth, sessions, stations

app = FastAPI(title=settings.app_name, debug=settings.debug, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(stations.router)


# French labels for the Pydantic field names shown in validation errors.
_FIELD_LABELS = {
    "email": "L'adresse email",
    "username": "Le nom d'utilisateur",
    "password": "Le mot de passe",
}


def _validation_message(error: dict) -> str:
    """Build a single French sentence from a Pydantic validation error."""
    loc = error.get("loc", ())
    field = loc[-1] if loc else None
    label = _FIELD_LABELS.get(field, f"Le champ « {field} »" if field else "Un champ")
    err_type = error.get("type", "")

    if err_type in ("value_error.email", "value_error.email_str"):
        return "L'adresse email saisie n'est pas valide."
    if "too_short" in err_type:
        limit = error.get("ctx", {}).get("limit", "")
        return f"{label} doit contenir au moins {limit} caractères."
    if "too_long" in err_type:
        limit = error.get("ctx", {}).get("limit", "")
        return f"{label} ne doit pas dépasser {limit} caractères."
    if err_type == "value_error.missing":
        return f"{label} est obligatoire."
    return error.get("msg", "Donnée invalide.")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """Return validation errors as a single, user-friendly French message."""
    errors = exc.errors()
    detail = _validation_message(errors[0]) if errors else "Données invalides."
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": detail},
    )


@app.on_event("startup")
def on_startup() -> None:
    # Create SQLite tables on startup, then apply lightweight migrations.
    init_db()
    run_migrations()


@app.get("/api/health", tags=["system"])
def health() -> Dict[str, str]:
    return {"status": "ok", "app": settings.app_name}


def run() -> None:
    """Entrypoint used by both `python -m app.main` and the PyInstaller .exe."""
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)


if __name__ == "__main__":
    run()
