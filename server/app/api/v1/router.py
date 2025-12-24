"""
API v1 router
"""
from fastapi import APIRouter

from app.api.v1 import auth, admin, users, calendars, events, tasks, stats

api_router = APIRouter()

# Auth
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Users
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Calendars
api_router.include_router(calendars.router, prefix="/calendars", tags=["calendars"])

# Events
api_router.include_router(events.router, prefix="/events", tags=["events"])

# Tasks
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])

# Admin
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

# Stats
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
