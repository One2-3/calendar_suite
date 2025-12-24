# JCloud Deployment Guide (FastAPI + MySQL + Redis)

This guide assumes Docker and Docker Compose are installed on the JCloud VM.

## 1) Upload Project
Copy the `server/` folder to the VM (SCP, SFTP, or Git pull).

## 2) Configure Environment
Create `.env` from the example:
```bash
cp .env.example .env
```
Edit `.env` with real values (JWT secret, DB passwords, OAuth secrets).

## 3) Start Services
```bash
docker compose up -d
docker compose ps
```

## 4) Open Firewall Ports
Allow inbound access to the API port (default 8080).

## 5) Health Check
```bash
curl http://<server-ip>:8080/health
```

## 6) Data Persistence
MySQL and Redis use Docker volumes defined in `docker-compose.yml`.

## 7) Restart Policy
`docker-compose.yml` uses `restart: unless-stopped`, so containers start after
VM reboot.
