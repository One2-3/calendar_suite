# Calendar Suite API Server

FastAPI backend for the term project. This folder is the submission target for
backend/deploy/docs only.

## Features Checklist (Backend)
- FastAPI + OpenAPI/Swagger (`/docs`)
- MySQL + SQLAlchemy ORM + FK + indexes + Alembic migrations
- Redis (refresh tokens + global rate limit)
- JWT access/refresh with RBAC (USER/ADMIN)
- Social login: Google OAuth + Firebase Auth
- 30+ endpoints, 12+ HTTP status codes
- Health check: `GET /health`
- Dockerfile + docker-compose
- Postman collection (env + scripts)

## Quick Start (Docker Compose)
```bash
cp .env.example .env
docker compose up -d
docker compose ps
curl http://localhost:8080/health
```

## Local Dev (venv)
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

## Migrations
```bash
docker compose exec server alembic upgrade head
```

## Seed Data
```bash
docker compose exec server python scripts/seed.py
```

## API Docs
- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`
- OpenAPI JSON: `http://localhost:8080/openapi.json`

## Auth Setup

### Firebase Auth
1) Create a Firebase project and service account.
2) Place the JSON in the server root (not committed):
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```
Or use JSON string:
```env
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```
Check config:
```bash
python scripts/check_firebase.py
```

### Google OAuth
Create OAuth 2.0 credentials in Google Cloud Console.
```env
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/api/v1/auth/google/callback
```

## Postman
Import:
- `postman/Calendar_Suite_API.postman_collection.json`
- `postman/Calendar_Suite_API.postman_environment.json`

## Security Notes
- Do not commit `.env`, service account JSON, or secrets.
- Use `.env.example` as a template.

## Deploy to JCloud (Docker Compose)
1) Copy `server/` to your JCloud VM.
2) Create `.env` from `.env.example` and fill secrets.
3) Start services:
```bash
docker compose up -d
```
4) Ensure ports are open (e.g., 8080, 3307 if mapped).
5) Verify:
```bash
curl http://<server-ip>:8080/health
```

The `docker-compose.yml` includes `restart: unless-stopped` to keep services
running after reboot.

More details: `docs/DEPLOY_JCLOUD.md`
