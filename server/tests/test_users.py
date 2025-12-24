"""
사용자 관련 테스트
"""
import pytest
from fastapi import status


class TestGetMe:
    """내 정보 조회 테스트"""
    
    def test_get_me_success(self, client, auth_headers):
        """내 정보 조회 성공"""
        response = client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "display_name" in data
    
    def test_get_me_unauthorized(self, client):
        """인증 없이 조회 실패 (403)"""
        response = client.get("/api/v1/users/me")
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestUpdateMe:
    """내 정보 수정 테스트"""
    
    def test_update_me_success(self, client, auth_headers):
        """내 정보 수정 성공"""
        response = client.put(
            "/api/v1/users/me",
            headers=auth_headers,
            json={"display_name": "Updated Name"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["display_name"] == "Updated Name"
    
    def test_update_me_duplicate_email(self, client, auth_headers, test_admin):
        """중복 이메일로 수정 실패 (409)"""
        response = client.put(
            "/api/v1/users/me",
            headers=auth_headers,
            json={"email": test_admin.email},
        )
        assert response.status_code == status.HTTP_409_CONFLICT
    
    def test_update_me_unauthorized(self, client):
        """인증 없이 수정 실패 (403)"""
        response = client.put(
            "/api/v1/users/me",
            json={"display_name": "New Name"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetUsers:
    """사용자 목록 조회 테스트 (관리자)"""
    
    def test_get_users_success(self, client, admin_headers):
        """사용자 목록 조회 성공 (관리자)"""
        response = client.get("/api/v1/users", headers=admin_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "content" in data
        assert "page" in data
        assert "total_elements" in data
    
    def test_get_users_forbidden(self, client, auth_headers):
        """일반 사용자 접근 실패 (403)"""
        response = client.get("/api/v1/users", headers=auth_headers)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_users_unauthorized(self, client):
        """인증 없이 조회 실패 (403)"""
        response = client.get("/api/v1/users")
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetUser:
    """사용자 상세 조회 테스트 (관리자)"""
    
    def test_get_user_success(self, client, admin_headers, test_user):
        """사용자 상세 조회 성공 (관리자)"""
        response = client.get(
            f"/api/v1/users/{test_user.id}",
            headers=admin_headers,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_user.id
    
    def test_get_user_not_found(self, client, admin_headers):
        """존재하지 않는 사용자 조회 실패 (404)"""
        response = client.get(
            "/api/v1/users/nonexistent-id",
            headers=admin_headers,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_user_forbidden(self, client, auth_headers, test_user):
        """일반 사용자 접근 실패 (403)"""
        response = client.get(
            f"/api/v1/users/{test_user.id}",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

