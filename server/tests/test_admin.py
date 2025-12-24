"""
관리자 관련 테스트
"""
import pytest
from fastapi import status
from app.models.user import UserRole


class TestAdminGetUsers:
    """관리자 - 사용자 목록 조회 테스트"""
    
    def test_admin_get_users_success(self, client, admin_headers):
        """관리자 사용자 목록 조회 성공"""
        response = client.get("/api/v1/admin/users", headers=admin_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_get_users_forbidden(self, client, auth_headers):
        """일반 사용자 접근 실패 (403)"""
        response = client.get("/api/v1/admin/users", headers=auth_headers)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_get_users_unauthorized(self, client):
        """인증 없이 조회 실패 (403)"""
        response = client.get("/api/v1/admin/users")
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestAdminUpdateRole:
    """관리자 - 사용자 역할 변경 테스트"""
    
    def test_admin_update_role_success(self, client, admin_headers, test_user):
        """사용자 역할 변경 성공"""
        response = client.patch(
            f"/api/v1/admin/users/{test_user.id}/role",
            headers=admin_headers,
            json={"new_role": UserRole.ADMIN.value},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["role"] == UserRole.ADMIN.value
    
    def test_admin_update_role_not_found(self, client, admin_headers):
        """존재하지 않는 사용자 역할 변경 실패 (404)"""
        response = client.patch(
            "/api/v1/admin/users/nonexistent-id/role",
            headers=admin_headers,
            json={"new_role": UserRole.ADMIN.value},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_admin_update_role_forbidden(self, client, auth_headers, test_user):
        """일반 사용자 접근 실패 (403)"""
        response = client.patch(
            f"/api/v1/admin/users/{test_user.id}/role",
            headers=auth_headers,
            json={"new_role": UserRole.ADMIN.value},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestAdminBanUser:
    """관리자 - 사용자 차단 테스트"""
    
    def test_admin_ban_user_success(self, client, admin_headers, test_user):
        """사용자 차단 성공"""
        response = client.post(
            f"/api/v1/admin/users/{test_user.id}/ban",
            headers=admin_headers,
            json={"reason": "Test ban"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["is_banned"] is True
    
    def test_admin_ban_user_not_found(self, client, admin_headers):
        """존재하지 않는 사용자 차단 실패 (404)"""
        response = client.post(
            "/api/v1/admin/users/nonexistent-id/ban",
            headers=admin_headers,
            json={"reason": "Test ban"},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_admin_ban_self_forbidden(self, client, admin_headers, test_admin):
        """자기 자신 차단 실패 (400)"""
        response = client.post(
            f"/api/v1/admin/users/{test_admin.id}/ban",
            headers=admin_headers,
            json={"reason": "Test ban"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestAdminDeactivateUser:
    """관리자 - 사용자 비활성화 테스트"""
    
    def test_admin_deactivate_user_success(self, client, admin_headers, test_user):
        """사용자 비활성화 성공"""
        response = client.post(
            f"/api/v1/admin/users/{test_user.id}/deactivate",
            headers=admin_headers,
            json={"reason": "Test deactivation"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["is_active"] is False
    
    def test_admin_deactivate_user_not_found(self, client, admin_headers):
        """존재하지 않는 사용자 비활성화 실패 (404)"""
        response = client.post(
            "/api/v1/admin/users/nonexistent-id/deactivate",
            headers=admin_headers,
            json={"reason": "Test deactivation"},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_admin_deactivate_self_forbidden(self, client, admin_headers, test_admin):
        """자기 자신 비활성화 실패 (400)"""
        response = client.post(
            f"/api/v1/admin/users/{test_admin.id}/deactivate",
            headers=admin_headers,
            json={"reason": "Test deactivation"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestAdminDeleteUser:
    """관리자 - 사용자 삭제 테스트"""
    
    def test_admin_delete_user_success(self, client, admin_headers, test_user):
        """사용자 삭제 성공"""
        response = client.delete(
            f"/api/v1/admin/users/{test_user.id}",
            headers=admin_headers,
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_admin_delete_user_not_found(self, client, admin_headers):
        """존재하지 않는 사용자 삭제 실패 (404)"""
        response = client.delete(
            "/api/v1/admin/users/nonexistent-id",
            headers=admin_headers,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_admin_delete_self_forbidden(self, client, admin_headers, test_admin):
        """자기 자신 삭제 실패 (400)"""
        response = client.delete(
            f"/api/v1/admin/users/{test_admin.id}",
            headers=admin_headers,
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

