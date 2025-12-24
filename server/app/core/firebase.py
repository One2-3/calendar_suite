"""
Firebase Admin SDK 초기화
"""
import json
import os
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, auth
from app.core.config import settings

from __future__ import annotations

import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

_firebase_app: Optional[firebase_admin.App] = None


def init_firebase() -> Optional[firebase_admin.App]:
    """
    Firebase Admin SDK 초기화.
    - settings.FIREBASE_SERVICE_ACCOUNT_JSON (파일 경로) 또는
    - settings.FIREBASE_SERVICE_ACCOUNT_JSON_TEXT (JSON 텍스트)
    둘 중 하나 필요.
    """
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    try:
        cred_json_text = settings.FIREBASE_SERVICE_ACCOUNT_JSON_TEXT
        cred_path = settings.FIREBASE_SERVICE_ACCOUNT_JSON

        if cred_json_text:
            try:
                cred_dict = json.loads(cred_json_text)
            except Exception:
                logger.exception("FIREBASE_SERVICE_ACCOUNT_JSON_TEXT is not valid JSON")
                return None
            cred = credentials.Certificate(cred_dict)

        elif cred_path:
            if not os.path.exists(cred_path):
                logger.error(f"Firebase credential file not found: {cred_path}")
                return None
            cred = credentials.Certificate(cred_path)

        else:
            logger.error(
                "Firebase credential is not configured. "
                "Set FIREBASE_SERVICE_ACCOUNT_JSON (file path) or FIREBASE_SERVICE_ACCOUNT_JSON_TEXT (json text)."
            )
            return None

        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin initialized")
        return _firebase_app

    except ValueError:
        # credentials.Certificate 형식 문제 등
        logger.exception("Firebase initialize_app failed (ValueError)")
        return None
    except Exception:
        logger.exception("Firebase initialize_app failed (Unexpected)")
        return None


def verify_firebase_token(id_token: str) -> Dict[str, Any]:
    """
    Firebase ID Token 검증.
    - 성공: decoded token(dict)
    - 실패: ValueError (라우터에서 401 처리)
    """
    if not id_token or not str(id_token).strip():
        raise ValueError("idToken is required")

    token = str(id_token).strip()
    if token.startswith("Bearer "):
        token = token[len("Bearer ") :].strip()

    # Firebase가 아예 초기화 안 되었으면 명확히 알림(503로 처리하도록)
    if init_firebase() is None:
        raise RuntimeError("Firebase is not initialized")

    try:
        # 기본 검증 (서명/만료 등)
        decoded = auth.verify_id_token(token)

        # (선택) 프로젝트 ID 체크 강화
        if settings.FIREBASE_PROJECT_ID:
            aud = decoded.get("aud")
            if aud != settings.FIREBASE_PROJECT_ID:
                raise ValueError("Invalid token audience (project mismatch)")

        return decoded

    except ValueError as e:
        # 토큰 자체 문제(만료/서명/형식)
        raise ValueError(f"Invalid Firebase token: {str(e)}")
    except Exception as e:
        # 네트워크/키/설정 문제일 수 있음
        # 라우터에서 503로 내리도록 RuntimeError로 변환(또는 그대로 raise)
        raise RuntimeError(f"Firebase token verification error: {str(e)}")


