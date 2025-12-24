"""
Google OAuth 설정
"""
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from app.core.config import settings


def get_google_oauth() -> OAuth:
    """
    Google OAuth 클라이언트 생성
    
    Authlib을 사용하여 Google OAuth 클라이언트를 생성합니다.
    """
    config = Config(environ={
        "GOOGLE_CLIENT_ID": settings.GOOGLE_OAUTH_CLIENT_ID or "",
        "GOOGLE_CLIENT_SECRET": settings.GOOGLE_OAUTH_CLIENT_SECRET or "",
    })
    
    oauth = OAuth(config)
    
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_OAUTH_CLIENT_ID,
        client_secret=settings.GOOGLE_OAUTH_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={
            "scope": "openid email profile",
        },
    )
    
    return oauth






