# DenkoCyber

Cybercafé supervision & session management — full-stack starter project (2021 stack):

- **Frontend**: React 17 + Vite 2 + Tailwind CSS 2 (operator console + client station screen).
- **Backend**: FastAPI + SQLAlchemy + SQLite (JWT auth, sessions, stations), packaged as a Windows `.exe` with PyInstaller.

> Initialized in 2021 — dependency versions pinned to that era.

---

## Workflow

DenkoCyber manages prepaid computer time in a cybercafé. The end-to-end flow is:

```
1. Operator (web console)
   → picks a station + a duration
   → the backend generates a unique 4-character CODE

2. Client goes to the station
   → opens the station screen  ( /station?station=PC-02 )
   → types the CODE

3. The station "claims" the code
   → the session starts (status running)
   → the station becomes BUSY
   → the client screen shows a live countdown HH:MM:SS

4. Time runs out (or the operator presses stop)
   → the session ends (done / expired)
   → the station becomes FREE again
   → the amount is billed and counted in the day's revenue
```

### Billing rules

- The amount charged = **time actually used × the station's rate** (per-minute).
- An early stop bills only the elapsed time (prorated).
- A session that runs its full duration (or expires) bills its full planned amount.
- A client is never billed more than the duration requested.
- **Revenue of the day** counts sessions that **ended** today (`ended_at`), i.e. money actually collected today.

---

## Features

### Authentication
- Register / login with JWT (OAuth2 password flow).
- Current-user endpoint protected by Bearer token.
- Passwords hashed (bcrypt), French error messages.

### Stations (computers)
- CRUD on stations, each with its own **rate per minute** (e.g. 30 Ar/min basic, 50 Ar/min gaming).
- Status per station: `free`, `busy`, `offline`.
- Seed endpoint + `seed.py` script to create the default 8 stations.
- Bulk live endpoint (`GET /api/stations/live`) returning every station's state in one call.

### Sessions
- Create a session (station + duration) → generates a unique 4-character code.
- **Claim**: a station starts a session by submitting its code.
- Start / stop manually, or let it **auto-expire** when the time is up.
- Live state per session and per station (remaining seconds).
- Automatic station status sync: `busy` on start, `free` on end/expiry.

### Operator console (React)
- **Dashboard**: key figures (stations busy/total, running sessions, sessions today, revenue of the day) + live list of running sessions with countdowns.
- **Session**: pick a station, set duration or amount (the other updates automatically), edit the station rate inline, generate a code; station grid with a **live countdown** on busy stations and a **stop button** to release a station.
- **History**: filterable (status, date), paginated list of sessions with totals.
- Auth pages (login / register).

### Client station screen (`/station`)
- Public page opened on each PC (e.g. `/station?station=PC-02`).
- Type the code → the session starts → big **HH:MM:SS countdown** + progress bar.
- Resynchronizes with the backend, detects expiry, shows "Session terminée".

---

## Project layout

```
DenkoCyber/
├── src/                        # React frontend
│   ├── components/             # AppLayout, Sidebar, AuthLayout, ui primitives
│   ├── pages/                  # Dashboard, NewSession, History, Station, Login, Register
│   ├── services/api.js         # API client (auth, sessions, stations)
│   ├── tailwind-safelist.jsx   # classes used in template literals (Tailwind v2 purge)
│   └── index.css
├── backend/                    # Python backend
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint + French validation errors
│   │   ├── config.py           # Settings (env-driven)
│   │   ├── database.py         # SQLAlchemy engine / session
│   │   ├── models.py           # User, Session, Station
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── security.py         # Password hashing + JWT
│   │   ├── deps.py             # Auth dependencies
│   │   ├── session_logic.py    # claim / expire / live / billing logic
│   │   ├── migrations.py       # light SQLite column migrations
│   │   └── routers/            # auth.py, sessions.py, stations.py
│   ├── seed.py                 # seed default stations
│   ├── requirements.txt
│   ├── run_backend.py          # PyInstaller entrypoint
│   ├── build_exe.py            # Builds the .exe
│   └── run_dev.ps1             # Dev server helper
└── .env.example                # VITE_API_URL
```

---

## Frontend

```powershell
npm install
npm run dev      # http://localhost:3000
npm run build
```

Optionally copy `.env.example` to `.env` and set `VITE_API_URL` (defaults to `http://127.0.0.1:8000`).

## Backend (development)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Or simply: `.\run_dev.ps1`

Seed the default stations (8 PCs):

```powershell
.\.venv\Scripts\python.exe seed.py
```

API available at http://127.0.0.1:8000 (docs at `/docs`). A SQLite file `denkocyber.db` is created on first run.

---

## API endpoints

### Auth

| Method | Path                 | Description                 |
|--------|----------------------|-----------------------------|
| GET    | `/api/health`        | Health check                |
| POST   | `/api/auth/register` | Create a user               |
| POST   | `/api/auth/login`    | Get a JWT (OAuth2 form)     |
| GET    | `/api/auth/me`       | Current user (Bearer token) |

### Stations

| Method | Path                            | Description                              |
|--------|---------------------------------|------------------------------------------|
| GET    | `/api/stations`                 | List stations                            |
| POST   | `/api/stations`                 | Create a station                         |
| GET    | `/api/stations/{id}`            | Read one station                         |
| PATCH  | `/api/stations/{id}`            | Update a station (name, status, rate…)   |
| DELETE | `/api/stations/{id}`            | Delete a station                         |
| POST   | `/api/stations/seed`            | Seed default stations (idempotent)       |
| GET    | `/api/stations/live`            | Live state of **all** stations (1 call)  |
| GET    | `/api/stations/by-code/{code}/live` | Live state of one station (public)   |

### Sessions

| Method | Path                        | Description                                  |
|--------|-----------------------------|----------------------------------------------|
| POST   | `/api/sessions`             | Create a session → returns a 4-char code     |
| GET    | `/api/sessions`             | List current user's sessions                 |
| GET    | `/api/sessions/history`     | Paginated history (filters: status, date)    |
| GET    | `/api/sessions/stats`       | Dashboard figures                            |
| GET    | `/api/sessions/{code}`      | Read a session                               |
| POST   | `/api/sessions/{code}/start`| Start a pending session (operator)           |
| POST   | `/api/sessions/{code}/stop` | Stop a running session (bills elapsed time)  |
| GET    | `/api/sessions/{code}/live` | Live state of a session's station            |
| POST   | `/api/sessions/claim`       | Start a session from a station (**public**)  |

> `claim` and `.../live` are public (no token): the 4-character code is the
> secret typed by the client. All other endpoints require a Bearer token.

---

## Building the backend as a Windows .exe

```powershell
cd backend
.\.venv\Scripts\python.exe build_exe.py
```

Output: `backend/dist/DenkoCyberBackend.exe`. When frozen, the SQLite database is created next to the executable.

## Configuration

Copy `backend/.env.example` to `backend/.env` and set at least `SECRET_KEY` in production.
