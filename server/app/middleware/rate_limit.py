"""
Rate limit middleware (Redis-backed).
"""
import time
from typing import Callable

from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.exceptions import create_error_response


def _get_redis_client():
    """Fetch Redis client at runtime to allow test overrides."""
    try:
        from app.db.redis import get_redis
        return get_redis()
    except Exception:
        return None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Global rate limit middleware.

    - IP-based limiting
    - 429 response on limit exceeded
    """

    def __init__(
        self,
        app,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip health/docs endpoints
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # ✅ preflight(OPTIONS)는 레이트리밋/인증/기타 로직 없이 무조건 통과
        if request.method == "OPTIONS":
            return await call_next(request)

        redis_client = _get_redis_client()
        if redis_client is None:
            # Redis가 없으면 레이트리밋 없이 통과
            return await call_next(request)

        # Client IP (proxy 환경이면 X-Forwarded-For 고려 필요)
        client_ip = request.client.host if request.client else "unknown"

        current_minute = int(time.time() / 60)
        current_hour = int(time.time() / 3600)

        minute_key = f"rate_limit:minute:{client_ip}:{current_minute}"
        hour_key = f"rate_limit:hour:{client_ip}:{current_hour}"

        minute_count = redis_client.get(minute_key)
        if minute_count and int(minute_count) >= self.requests_per_minute:
            return create_error_response(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                code="RATE_LIMIT_EXCEEDED",
                message="Too many requests. Please try again later.",
                details={
                    "limit": self.requests_per_minute,
                    "window": "1 minute",
                    "retry_after": 60,
                },
                request=request,
            )

        hour_count = redis_client.get(hour_key)
        if hour_count and int(hour_count) >= self.requests_per_hour:
            return create_error_response(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                code="RATE_LIMIT_EXCEEDED",
                message="Too many requests. Please try again later.",
                details={
                    "limit": self.requests_per_hour,
                    "window": "1 hour",
                    "retry_after": 3600,
                },
                request=request,
            )

        redis_client.incr(minute_key)
        redis_client.expire(minute_key, 60)
        redis_client.incr(hour_key)
        redis_client.expire(hour_key, 3600)

        return await call_next(request)
