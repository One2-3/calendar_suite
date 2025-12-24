"""
Pydantic Settings를 사용한 환경변수 관리
"""
from datetime import datetime
from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from __future__ import annotations

import json
import os
from typing import List, Optional

from pydantic import BaseModel


def _parse_cors_origins(value: Optional[str]) -> List[str]:
    """
    CORS_ORIGINS 파싱:
    - "http://a,http://b" (콤마 구분)
    - '["http://a","http://b"]' (JSON 배열 문자열)
    둘 다 지원
    """
    if not value:
        return []

    raw = value.strip()
    if not raw:
        return []

    # JSON list 형태 지원
    if raw.startswith("[") and raw.endswith("]"):
        try:
            arr = json.loads(raw)
            if isinstance(arr, list):
                return [str(x).strip() for x in arr if str(x).strip()]
        except Exception:
            # JSON 파싱 실패 시 콤마 split으로 fallback
            pass

    # 콤마 구분
    return [v.strip() for v in raw.split(",") if v.strip()]


class Settings(BaseModel):
    # 기본 메타
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Calendar Suite API")
    VERSION: str = os.getenv("VERSION", "0.1.0")
    BUILD_TIME: str = os.getenv("BUILD_TIME", "")

    # 환경 분리
    # dev/prod/stage 등
    ENV: str = os.getenv("ENV", os.getenv("APP_ENV", "dev")).lower()

    # 서버
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")

    # CORS
    # allow_credentials=True 사용 시 "*" 금지!
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )

    # Firebase (둘 중 하나는 반드시 설정)
    # 1) 파일 경로 방식
    FIREBASE_SERVICE_ACCOUNT_JSON: Optional[str] = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    # 2) JSON 텍스트를 env로 넣는 방식
    FIREBASE_SERVICE_ACCOUNT_JSON_TEXT: Optional[str] = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON_TEXT")

    # (선택) Firebase verify 시 audience/project 검증 강화용
    FIREBASE_PROJECT_ID: Optional[str] = os.getenv("FIREBASE_PROJECT_ID")

    @property
    def cors_origins_list(self) -> List[str]:
        origins = _parse_cors_origins(self.CORS_ORIGINS)

        # dev에서는 로컬 기본 origin 항상 포함 (실수 방지)
        if self.ENV != "prod":
            base = {"http://localhost:5173", "http://127.0.0.1:5173"}
            return sorted(set(origins) | base)

        # prod에서는 설정된 값만 사용(운영 보안)
        return origins


settings = Settings()