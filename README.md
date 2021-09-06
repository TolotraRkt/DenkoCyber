# DenkoCyber

Full-stack starter project (stack 2021) :

- **Frontend**: React 17 + Vite 2 + Tailwind CSS 2 (interface de supervision cybercafé).
- **Backend**: FastAPI + SQLAlchemy + SQLite (authentification JWT, prêt à être empaqueté en `.exe` Windows avec PyInstaller).

> Projet initialisé en 2021 — versions des dépendances figées à cette époque.

## Project layout

```
DenkoCyber/
├── src/                     # React frontend
│   ├── context/AuthContext.jsx
│   └── services/api.js      # API client (auth endpoints)
├── backend/                 # Python backend
│   ├── app/
│   │   ├── main.py          # FastAPI entrypoint
│   │   ├── config.py        # Settings (env-driven)
│   │   ├── database.py      # SQLAlchemy engine / session
│   │   ├── models.py        # User model
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── security.py      # Password hashing + JWT
│   │   ├── deps.py          # Auth dependencies
│   │   └── routers/auth.py  # register / login / me
│   ├── requirements.txt
│   ├── run_backend.py       # PyInstaller entrypoint
│   ├── build_exe.py         # Builds the .exe
│   └── run_dev.ps1          # Dev server helper
└── .env.example             # VITE_API_URL
```

## Frontend

```powershell
npm install
npm run dev      # http://localhost:5173
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

API available at http://127.0.0.1:8000 (docs at `/docs`). A SQLite file `denkocyber.db` is created on first run.

### Endpoints

| Method | Path                 | Description                     |
|--------|----------------------|---------------------------------|
| GET    | `/api/health`        | Health check                    |
| POST   | `/api/auth/register` | Create a user                   |
| POST   | `/api/auth/login`    | Get a JWT (OAuth2 form)         |
| GET    | `/api/auth/me`       | Current user (Bearer token)     |

## Building the backend as a Windows .exe

```powershell
cd backend
.\.venv\Scripts\python.exe build_exe.py
```

Output: `backend/dist/DenkoCyberBackend.exe`. When frozen, the SQLite database is created next to the executable.

## Configuration

Copy `backend/.env.example` to `backend/.env` and set at least `SECRET_KEY` in production.
