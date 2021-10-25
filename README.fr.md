# DenkoCyber

Supervision de cybercafé et gestion des sessions — projet full-stack (stack 2021) :

- **Frontend** : React 17 + Vite 2 + Tailwind CSS 2 (console opérateur + écran poste client).
- **Backend** : FastAPI + SQLAlchemy + SQLite (auth JWT, sessions, postes), empaquetable en `.exe` Windows avec PyInstaller.

> Projet initialisé en 2021 — versions des dépendances figées à cette époque.

---

## Workflow

DenkoCyber gère du temps d'ordinateur prépayé dans un cybercafé. Le parcours complet est :

```
1. L'opérateur (console web)
   → choisit un poste + une durée
   → le backend génère un CODE unique de 4 caractères

2. Le client va sur le poste
   → ouvre l'écran poste  ( /station?station=PC-02 )
   → saisit le CODE

3. Le poste « réclame » le code
   → la session démarre (statut running)
   → le poste passe OCCUPÉ
   → l'écran client affiche un compte à rebours HH:MM:SS

4. Le temps s'écoule (ou l'opérateur presse stop)
   → la session se termine (done / expired)
   → le poste redevient LIBRE
   → le montant est facturé et compté dans les revenus du jour
```

### Règles de facturation

- Le montant facturé = **temps réellement utilisé × tarif du poste** (par minute).
- Un arrêt anticipé facture uniquement le temps écoulé (au prorata).
- Une session qui va au bout (ou expire) facture son montant plein prévu.
- Un client n'est jamais facturé plus que la durée demandée.
- Les **revenus du jour** comptent les sessions **terminées** aujourd'hui (`ended_at`), c'est-à-dire l'argent réellement encaissé.

---

## Fonctionnalités

### Authentification
- Inscription / connexion avec JWT (flux OAuth2 password).
- Endpoint utilisateur courant protégé par token Bearer.
- Mots de passe hachés (bcrypt), messages d'erreur en français.

### Postes (ordinateurs)
- CRUD des postes, chacun avec son propre **tarif par minute** (ex. 30 Ar/min bureautique, 50 Ar/min gaming).
- Statut par poste : `free`, `busy`, `offline`.
- Endpoint de seed + script `seed.py` pour créer les 8 postes par défaut.
- Endpoint groupé live (`GET /api/stations/live`) renvoyant l'état de tous les postes en un seul appel.

### Sessions
- Créer une session (poste + durée) → génère un code unique de 4 caractères.
- **Claim** : un poste démarre une session en soumettant son code.
- Démarrage / arrêt manuels, ou **expiration automatique** quand le temps est écoulé.
- État temps réel par session et par poste (secondes restantes).
- Synchronisation automatique du statut du poste : `busy` au démarrage, `free` à la fin/expiration.

### Console opérateur (React)
- **Tableau de bord** : chiffres clés (postes occupés/total, sessions en cours, sessions du jour, revenus du jour) + liste temps réel des sessions en cours avec compte à rebours.
- **Session** : choisir un poste, saisir une durée ou un montant (l'autre se calcule automatiquement), éditer le tarif du poste en ligne, générer un code ; grille des postes avec **compte à rebours en direct** sur les postes occupés et un **bouton stop** pour libérer un poste.
- **Historique** : liste filtrable (statut, date) et paginée des sessions, avec totaux.
- Pages d'authentification (login / register).

### Écran poste client (`/station`)
- Page publique ouverte sur chaque PC (ex. `/station?station=PC-02`).
- Saisir le code → la session démarre → grand **compte à rebours HH:MM:SS** + barre de progression.
- Se resynchronise avec le backend, détecte l'expiration, affiche « Session terminée ».

---

## Arborescence du projet

```
DenkoCyber/
├── src/                        # Frontend React
│   ├── components/             # AppLayout, Sidebar, AuthLayout, primitives ui
│   ├── pages/                  # Dashboard, NewSession, History, Station, Login, Register
│   ├── services/api.js         # Client API (auth, sessions, stations)
│   ├── tailwind-safelist.jsx   # classes utilisées dans des template literals (purge Tailwind v2)
│   └── index.css
├── backend/                    # Backend Python
│   ├── app/
│   │   ├── main.py             # Entrypoint FastAPI + erreurs de validation FR
│   │   ├── config.py           # Réglages (via variables d'environnement)
│   │   ├── database.py         # Engine / session SQLAlchemy
│   │   ├── models.py           # User, Session, Station
│   │   ├── schemas.py          # Schémas Pydantic
│   │   ├── security.py         # Hachage mot de passe + JWT
│   │   ├── deps.py             # Dépendances d'authentification
│   │   ├── session_logic.py    # Logique claim / expire / live / facturation
│   │   ├── migrations.py       # Migrations légères de colonnes SQLite
│   │   └── routers/            # auth.py, sessions.py, stations.py
│   ├── seed.py                 # Seed des postes par défaut
│   ├── requirements.txt
│   ├── run_backend.py          # Entrypoint PyInstaller
│   ├── build_exe.py            # Construit le .exe
│   └── run_dev.ps1             # Aide au serveur de dev
└── .env.example                # VITE_API_URL
```

---

## Frontend

```powershell
npm install
npm run dev      # http://localhost:3000
npm run build
```

Copiez éventuellement `.env.example` vers `.env` et définissez `VITE_API_URL` (par défaut `http://127.0.0.1:8000`).

## Backend (développement)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Ou simplement : `.\run_dev.ps1`

Seed des postes par défaut (8 PC) :

```powershell
.\.venv\Scripts\python.exe seed.py
```

API disponible sur http://127.0.0.1:8000 (docs sur `/docs`). Un fichier SQLite `denkocyber.db` est créé au premier lancement.

---

## Endpoints de l'API

### Auth

| Méthode | Chemin               | Description                       |
|---------|----------------------|-----------------------------------|
| GET     | `/api/health`        | Vérification de santé             |
| POST    | `/api/auth/register` | Créer un utilisateur              |
| POST    | `/api/auth/login`    | Obtenir un JWT (formulaire OAuth2)|
| GET     | `/api/auth/me`       | Utilisateur courant (token Bearer)|

### Postes

| Méthode | Chemin                          | Description                               |
|---------|---------------------------------|-------------------------------------------|
| GET     | `/api/stations`                 | Lister les postes                         |
| POST    | `/api/stations`                 | Créer un poste                            |
| GET     | `/api/stations/{id}`            | Lire un poste                             |
| PATCH   | `/api/stations/{id}`            | Modifier un poste (nom, statut, tarif…)   |
| DELETE  | `/api/stations/{id}`            | Supprimer un poste                        |
| POST    | `/api/stations/seed`            | Seed des postes par défaut (idempotent)   |
| GET     | `/api/stations/live`            | État live de **tous** les postes (1 appel)|
| GET     | `/api/stations/by-code/{code}/live` | État live d'un poste (public)         |

### Sessions

| Méthode | Chemin                      | Description                                       |
|---------|-----------------------------|---------------------------------------------------|
| POST    | `/api/sessions`             | Créer une session → renvoie un code de 4 car.     |
| GET     | `/api/sessions`             | Lister les sessions de l'utilisateur courant      |
| GET     | `/api/sessions/history`     | Historique paginé (filtres : statut, date)        |
| GET     | `/api/sessions/stats`       | Chiffres du tableau de bord                       |
| GET     | `/api/sessions/{code}`      | Lire une session                                  |
| POST    | `/api/sessions/{code}/start`| Démarrer une session en attente (opérateur)       |
| POST    | `/api/sessions/{code}/stop` | Arrêter une session (facture le temps écoulé)     |
| GET     | `/api/sessions/{code}/live` | État live du poste d'une session                  |
| POST    | `/api/sessions/claim`       | Démarrer une session depuis un poste (**public**) |

> `claim` et `.../live` sont publics (sans token) : le code de 4 caractères est le
> secret saisi par le client. Tous les autres endpoints exigent un token Bearer.

---

## Construire le backend en .exe Windows

```powershell
cd backend
.\.venv\Scripts\python.exe build_exe.py
```

Sortie : `backend/dist/DenkoCyberBackend.exe`. Une fois gelé, la base SQLite est créée à côté de l'exécutable.

## Configuration

Copiez `backend/.env.example` vers `backend/.env` et définissez au minimum `SECRET_KEY` en production.
