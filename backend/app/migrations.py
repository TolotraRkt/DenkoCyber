"""Lightweight schema migrations for the SQLite database.

The project does not use Alembic; this module applies the few idempotent
ALTER TABLE statements needed when a column is added to an existing DB.
Call ``run_migrations()`` right after ``init_db()``.
"""
from sqlalchemy import inspect, text

from .database import engine

# (table, column, DDL type) additions that may be missing on older databases.
_ADDED_COLUMNS = [
    ("sessions", "ends_at", "DATETIME"),
]


def _existing_columns(table: str) -> set:
    inspector = inspect(engine)
    if table not in inspector.get_table_names():
        return set()
    return {col["name"] for col in inspector.get_columns(table)}


def run_migrations() -> None:
    """Add any missing columns. Safe to call on every startup."""
    with engine.begin() as conn:
        for table, column, ddl_type in _ADDED_COLUMNS:
            if column not in _existing_columns(table):
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))
