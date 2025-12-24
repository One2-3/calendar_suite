"""
로깅 미들웨어: 요청/응답 로깅
"""
import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """요청/응답 로깅 미들웨어"""

    async def dispatch(self, request: Request, call_next):
        # 요청 시작 시간
        start_time = time.time()

        # 요청 정보 로깅
        method = request.method
        path = request.url.path
        logger.info(f"Request: {method} {path}")

        # 요청 처리
        response = await call_next(request)

        # 응답 시간 계산
        process_time = (time.time() - start_time) * 1000  # 밀리초

        # 응답 정보 로깅
        status_code = response.status_code
        logger.info(
            f"Response: {method} {path} - Status: {status_code} - Latency: {process_time:.2f}ms"
        )

        return response







