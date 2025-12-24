"""
pytest 설정 및 공통 픽스처
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid
from datetime import datetime

# 테스트 환경 변수 설정
os.environ["TESTING"] = "1"

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.db.redis import get_redis
from app.models.user import User, UserRole
from app.core.security import hash_password


# 테스트용 인메모리 SQLite 데이터베이스
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """테스트용 데이터베이스 세션"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def mock_redis():
    """테스트용 Redis 모킹"""
    class MockRedis:
        def __init__(self):
            self._data = {}
        
        def get(self, key):
            return self._data.get(key)
        
        def set(self, key, value):
            self._data[key] = value
            return True
        
        def setex(self, key, ttl, value):
            self._data[key] = value
            return True
        
        def delete(self, key):
            if key in self._data:
                del self._data[key]
            return 1
        
        def exists(self, key):
            return 1 if key in self._data else 0
        
        def incr(self, key):
            if key not in self._data:
                self._data[key] = 0
            self._data[key] = int(self._data[key]) + 1
            return self._data[key]
        
        def expire(self, key, ttl):
            return True
    
    return MockRedis()


@pytest.fixture(scope="function")
def client(db, mock_redis):
    """테스트 클라이언트"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    def override_get_redis():
        return mock_redis
    
    # FastAPI dependency override
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis
    
    # Monkey patch for middleware (rate_limit uses direct import)
    import app.db.redis as redis_module
    original_get_redis = redis_module.get_redis
    redis_module.get_redis = lambda: mock_redis
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Restore
    app.dependency_overrides.clear()
    redis_module.get_redis = original_get_redis


@pytest.fixture
def test_user(db):
    """테스트용 일반 사용자"""
    user = User(
        id=str(uuid.uuid4()),
        email="testuser@example.com",
        password=hash_password("password123"),
        display_name="Test User",
        role=UserRole.USER,
        is_active=True,
        is_banned=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_admin(db):
    """테스트용 관리자 사용자"""
    admin = User(
        id=str(uuid.uuid4()),
        email="admin@example.com",
        password=hash_password("admin123"),
        display_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True,
        is_banned=False,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@pytest.fixture
def test_banned_user(db):
    """테스트용 차단된 사용자"""
    user = User(
        id=str(uuid.uuid4()),
        email="banned@example.com",
        password=hash_password("password123"),
        display_name="Banned User",
        role=UserRole.USER,
        is_active=True,
        is_banned=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_inactive_user(db):
    """테스트용 비활성화된 사용자"""
    user = User(
        id=str(uuid.uuid4()),
        email="inactive@example.com",
        password=hash_password("password123"),
        display_name="Inactive User",
        role=UserRole.USER,
        is_active=False,
        is_banned=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, test_user):
    """인증 헤더 (일반 사용자)"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "password123",
        },
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client, test_admin):
    """인증 헤더 (관리자)"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_admin.email,
            "password": "admin123",
        },
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

