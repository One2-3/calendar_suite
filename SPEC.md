# Backend API Specification

## Core Resources
- users
- calendars
- events
- auth

## Authentication
- POST /auth/login
- POST /auth/refresh
- GET /auth/google
- POST /auth/logout

## Role Based Access
- ROLE_USER
- ROLE_ADMIN

## Pagination / Search
- page (default: 0)
- size (default: 20, max: 100)
- sort=field,DESC|ASC
- keyword

## Error Response Format
```json
{
  "timestamp": "2025-03-05T12:34:56Z",
  "path": "/api/events/1",
  "status": 400,
  "code": "VALIDATION_FAILED",
  "message": "Invalid input",
  "details": {}
}
Health Check
GET /health

인증 없이 200 반환