"""
공통 에러 응답 포맷 생성
"""
from datetime import datetime
from typing import Any, Dict, Optional
from fastapi import Request
from fastapi.responses import JSONResponse


def create_error_response(
    status_code: int,
    code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
) -> JSONResponse:
    """
    공통 에러 응답 포맷 생성

    Args:
        status_code: HTTP 상태 코드
        code: 에러 코드
        message: 사용자 친화적 메시지
        details: 추가 상세 정보
        request: FastAPI Request 객체 (경로 추출용)

    Returns:
        JSONResponse: 공통 포맷의 에러 응답
    """
    path = request.url.path if request else "/unknown"

    response_data = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "path": path,
        "status": status_code,
        "code": code,
        "message": message,
    }

    if details:
        response_data["details"] = details

    return JSONResponse(
        status_code=status_code,
        content=response_data,
    )







