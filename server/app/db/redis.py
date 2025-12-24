"""
Redis 연결 관리
"""
import redis
from app.core.config import settings

# Redis 클라이언트 생성
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    decode_responses=True,  # 문자열로 디코딩
    socket_connect_timeout=5,
    socket_timeout=5,
)


def get_redis() -> redis.Redis:
    """Redis 클라이언트 반환"""
    return redis_client


def test_redis_connection() -> bool:
    """Redis 연결 테스트"""
    try:
        redis_client.ping()
        return True
    except Exception:
        return False






