"""
통계 관련 테스트
"""
import pytest
from fastapi import status


class TestGetDailyStats:
    """일일 통계 조회 테스트"""
    
    def test_get_daily_stats_success(self, client, admin_headers):
        """일일 통계 조회 성공 (관리자)"""
        response = client.get(
            "/api/v1/stats/daily?days=7",
            headers=admin_headers,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 7
    
    def test_get_daily_stats_forbidden(self, client, auth_headers):
        """일반 사용자 접근 실패 (403)"""
        response = client.get(
            "/api/v1/stats/daily",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_daily_stats_unauthorized(self, client):
        """인증 없이 조회 실패 (403)"""
        response = client.get("/api/v1/stats/daily")
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetTopCalendars:
    """인기 캘린더 통계 조회 테스트"""
    
    def test_get_top_calendars_success(self, client, admin_headers):
        """인기 캘린더 통계 조회 성공 (관리자)"""
        response = client.get(
            "/api/v1/stats/top-calendars?limit=10",
            headers=admin_headers,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_top_calendars_forbidden(self, client, auth_headers):
        """일반 사용자 접근 실패 (403)"""
        response = client.get(
            "/api/v1/stats/top-calendars",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetStatsSummary:
    """통계 요약 조회 테스트"""
    
    def test_get_stats_summary_success(self, client, admin_headers):
        """통계 요약 조회 성공 (관리자)"""
        response = client.get(
            "/api/v1/stats/summary",
            headers=admin_headers,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_users" in data
        assert "total_calendars" in data
        assert "total_events" in data
        assert "total_tasks" in data
    
    def test_get_stats_summary_forbidden(self, client, auth_headers):
        """일반 사용자 접근 실패 (403)"""
        response = client.get(
            "/api/v1/stats/summary",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

