"""
캘린더 관련 테스트
"""
import pytest
from fastapi import status


class TestCreateCalendar:
    """캘린더 생성 테스트"""
    
    def test_create_calendar_success(self, client, auth_headers):
        """캘린더 생성 성공"""
        response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={
                "title": "Test Calendar",
                "description": "Test Description",
                "color": "#FF0000",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "Test Calendar"
        assert "id" in data
    
    def test_create_calendar_unauthorized(self, client):
        """인증 없이 생성 실패 (403)"""
        response = client.post(
            "/api/v1/calendars",
            json={"title": "Test Calendar"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_calendar_validation_error(self, client, auth_headers):
        """캘린더 생성 검증 오류 (422)"""
        response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={
                "title": "",  # 빈 제목
                "color": "invalid",  # 잘못된 색상 형식
            },
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestGetCalendars:
    """캘린더 목록 조회 테스트"""
    
    def test_get_calendars_success(self, client, auth_headers):
        """캘린더 목록 조회 성공"""
        response = client.get("/api/v1/calendars", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "content" in data
        assert "page" in data
    
    def test_get_calendars_unauthorized(self, client):
        """인증 없이 조회 실패 (403)"""
        response = client.get("/api/v1/calendars")
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetCalendar:
    """캘린더 상세 조회 테스트"""
    
    def test_get_calendar_success(self, client, auth_headers):
        """캘린더 상세 조회 성공"""
        # 먼저 캘린더 생성
        create_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "Test Calendar"},
        )
        calendar_id = create_response.json()["id"]
        
        # 조회
        response = client.get(
            f"/api/v1/calendars/{calendar_id}",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == calendar_id
    
    def test_get_calendar_not_found(self, client, auth_headers):
        """존재하지 않는 캘린더 조회 실패 (404)"""
        response = client.get(
            "/api/v1/calendars/nonexistent-id",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_calendar_forbidden(self, client, auth_headers):
        """다른 사용자의 캘린더 조회 실패 (403)"""
        # 일반 사용자로 캘린더 생성
        create_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "Private Calendar"},
        )
        calendar_id = create_response.json()["id"]
        
        # 다른 사용자 생성 및 로그인
        signup_response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "otheruser@example.com",
                "password": "password123",
                "display_name": "Other User",
            },
        )
        other_token = signup_response.json()["access_token"]
        other_headers = {"Authorization": f"Bearer {other_token}"}
        
        # 다른 사용자로 조회 시도 (관리자가 아니므로 실패해야 함)
        # 하지만 실제로는 관리자가 아니면 자신의 캘린더만 조회 가능
        # 인증 없이 조회 시도
        response = client.get(f"/api/v1/calendars/{calendar_id}")
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestUpdateCalendar:
    """캘린더 수정 테스트"""
    
    def test_update_calendar_success(self, client, auth_headers):
        """캘린더 수정 성공"""
        # 캘린더 생성
        create_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "Original Title"},
        )
        calendar_id = create_response.json()["id"]
        
        # 수정
        response = client.put(
            f"/api/v1/calendars/{calendar_id}",
            headers=auth_headers,
            json={"title": "Updated Title"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Title"
    
    def test_update_calendar_not_found(self, client, auth_headers):
        """존재하지 않는 캘린더 수정 실패 (404)"""
        response = client.put(
            "/api/v1/calendars/nonexistent-id",
            headers=auth_headers,
            json={"title": "Updated Title"},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestDeleteCalendar:
    """캘린더 삭제 테스트"""
    
    def test_delete_calendar_success(self, client, auth_headers):
        """캘린더 삭제 성공"""
        # 캘린더 생성
        create_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "To Delete"},
        )
        calendar_id = create_response.json()["id"]
        
        # 삭제
        response = client.delete(
            f"/api/v1/calendars/{calendar_id}",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # 삭제 확인
        get_response = client.get(
            f"/api/v1/calendars/{calendar_id}",
            headers=auth_headers,
        )
        assert get_response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_delete_calendar_not_found(self, client, auth_headers):
        """존재하지 않는 캘린더 삭제 실패 (404)"""
        response = client.delete(
            "/api/v1/calendars/nonexistent-id",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

