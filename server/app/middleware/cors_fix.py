"""
OpenAPI JSON 엔드포인트에 CORS 헤더 추가 미들웨어
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class CORBFixMiddleware(BaseHTTPMiddleware):
    """OpenAPI JSON 응답에 CORS 헤더 추가하여 CORB 에러 방지"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # OpenAPI JSON 엔드포인트에 CORS 헤더 추가
        if request.url.path == "/openapi.json":
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Content-Type"] = "application/json"
        
        return response






