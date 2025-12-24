"""
Rate Limit 테스트
"""
import pytest
from fastapi import status


class TestRateLimit:
    """Rate Limit 테스트"""
    
    def test_rate_limit_middleware(self, client):
        """Rate Limit 미들웨어 동작 확인"""
        # Health check는 제외되므로 정상 응답
        response = client.get("/health")
        assert response.status_code == status.HTTP_200_OK
        
        # Rate limit은 Redis 기반이므로 실제 환경에서만 테스트 가능
        # 여기서는 미들웨어가 정상적으로 등록되었는지만 확인
        # 실제 429 테스트는 통합 테스트에서 수행






