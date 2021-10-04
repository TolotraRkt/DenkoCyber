"""Seed the database with the default set of stations.

Run once after initial setup (or whenever the stations table is empty):
    python seed.py
Idempotent: does nothing if stations already exist.
"""
from app.database import SessionLocal, init_db
from app.models import Station
from app.routers.stations import DEFAULT_STATIONS


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        if db.query(Station).count() > 0:
            print(f"Stations already present ({db.query(Station).count()}), nothing to do.")
            return
        for code, name, rate in DEFAULT_STATIONS:
            db.add(Station(code=code, name=name, rate_per_minute=rate, status="free"))
        db.commit()
        print(f"Seeded {len(DEFAULT_STATIONS)} stations.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
