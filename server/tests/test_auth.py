"""
인증 관련 테스트
"""
import pytest
from fastapi import status


class TestSignup:
    """회원가입 테스트"""
    
    def test_signup_success(self, client):
        """회원가입 성공"""
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "newuser@example.com",
                "password": "password123",
                "display_name": "New User",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    def test_signup_duplicate_email(self, client, test_user):
        """중복 이메일 회원가입 실패 (409)"""
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": test_user.email,
                "password": "password123",
                "display_name": "Duplicate User",
            },
        )
        assert response.status_code == status.HTTP_409_CONFLICT
    
    def test_signup_validation_error(self, client):
        """회원가입 검증 오류 (422)"""
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "invalid-email",  # 잘못된 이메일
                "password": "123",  # 8자 미만
            },
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestLogin:
    """로그인 테스트"""
    
    def test_login_success(self, client, test_user):
        """로그인 성공"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "password123",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    def test_login_invalid_email(self, client):
        """잘못된 이메일 로그인 실패 (401)"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_invalid_password(self, client, test_user):
        """잘못된 비밀번호 로그인 실패 (401)"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_banned_user(self, client, test_banned_user):
        """차단된 사용자 로그인 실패 (403)"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_banned_user.email,
                "password": "password123",
            },
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_login_inactive_user(self, client, test_inactive_user):
        """비활성화된 사용자 로그인 실패 (403)"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_inactive_user.email,
                "password": "password123",
            },
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestRefresh:
    """토큰 갱신 테스트"""
    
    def test_refresh_success(self, client, test_user):
        """토큰 갱신 성공"""
        # 먼저 로그인
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "password123",
            },
        )
        refresh_token = login_response.json()["refresh_token"]
        
        # 토큰 갱신
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    def test_refresh_invalid_token(self, client):
        """잘못된 토큰 갱신 실패 (401)"""
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid_token"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestLogout:
    """로그아웃 테스트"""
    
    def test_logout_success(self, client, auth_headers):
        """로그아웃 성공"""
        response = client.post(
            "/api/v1/auth/logout",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_logout_unauthorized(self, client):
        """인증 없이 로그아웃 실패 (403)"""
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == status.HTTP_403_FORBIDDEN

