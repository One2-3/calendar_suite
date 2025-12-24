"""
이벤트 관련 테스트
"""
import pytest
from fastapi import status
from datetime import datetime, timedelta


class TestCreateEvent:
    """이벤트 생성 테스트"""
    
    def test_create_event_success(self, client, auth_headers):
        """이벤트 생성 성공"""
        # 먼저 캘린더 생성
        calendar_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "Test Calendar"},
        )
        calendar_id = calendar_response.json()["id"]
        
        # 이벤트 생성
        start_at = datetime.utcnow() + timedelta(days=1)
        end_at = start_at + timedelta(hours=2)
        
        response = client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "Test Event",
                "start_at": start_at.isoformat(),
                "end_at": end_at.isoformat(),
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "Test Event"
    
    def test_create_event_invalid_dates(self, client, auth_headers):
        """잘못된 날짜로 이벤트 생성 실패 (400)"""
        calendar_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "Test Calendar"},
        )
        calendar_id = calendar_response.json()["id"]
        
        start_at = datetime.utcnow() + timedelta(days=1)
        end_at = start_at - timedelta(hours=2)  # 종료일이 시작일보다 이전
        
        response = client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "Test Event",
                "start_at": start_at.isoformat(),
                "end_at": end_at.isoformat(),
            },
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_event_calendar_not_found(self, client, auth_headers):
        """존재하지 않는 캘린더에 이벤트 생성 실패 (404)"""
        start_at = datetime.utcnow() + timedelta(days=1)
        end_at = start_at + timedelta(hours=2)
        
        response = client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "calendar_id": "nonexistent-id",
                "title": "Test Event",
                "start_at": start_at.isoformat(),
                "end_at": end_at.isoformat(),
            },
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_create_event_unauthorized(self, client):
        """인증 없이 이벤트 생성 실패 (403)"""
        response = client.post(
            "/api/v1/events",
            json={"title": "Test Event"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetEvents:
    """이벤트 목록 조회 테스트"""
    
    def test_get_events_success(self, client, auth_headers):
        """이벤트 목록 조회 성공"""
        response = client.get("/api/v1/events", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "content" in data
    
    def test_get_events_unauthorized(self, client):
        """인증 없이 조회 실패 (403)"""
        response = client.get("/api/v1/events")
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetEvent:
    """이벤트 상세 조회 테스트"""
    
    def test_get_event_success(self, client, auth_headers):
        """이벤트 상세 조회 성공"""
        # 캘린더 및 이벤트 생성
        calendar_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "Test Calendar"},
        )
        calendar_id = calendar_response.json()["id"]
        
        start_at = datetime.utcnow() + timedelta(days=1)
        end_at = start_at + timedelta(hours=2)
        
        event_response = client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "Test Event",
                "start_at": start_at.isoformat(),
                "end_at": end_at.isoformat(),
            },
        )
        event_id = event_response.json()["id"]
        
        # 조회
        response = client.get(
            f"/api/v1/events/{event_id}",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == event_id
    
    def test_get_event_not_found(self, client, auth_headers):
        """존재하지 않는 이벤트 조회 실패 (404)"""
        response = client.get(
            "/api/v1/events/nonexistent-id",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestUpdateEvent:
    """이벤트 수정 테스트"""
    
    def test_update_event_success(self, client, auth_headers):
        """이벤트 수정 성공"""
        # 캘린더 및 이벤트 생성
        calendar_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "Test Calendar"},
        )
        calendar_id = calendar_response.json()["id"]
        
        start_at = datetime.utcnow() + timedelta(days=1)
        end_at = start_at + timedelta(hours=2)
        
        event_response = client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "Original Title",
                "start_at": start_at.isoformat(),
                "end_at": end_at.isoformat(),
            },
        )
        event_id = event_response.json()["id"]
        
        # 수정
        response = client.put(
            f"/api/v1/events/{event_id}",
            headers=auth_headers,
            json={"title": "Updated Title"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Title"
    
    def test_update_event_not_found(self, client, auth_headers):
        """존재하지 않는 이벤트 수정 실패 (404)"""
        response = client.put(
            "/api/v1/events/nonexistent-id",
            headers=auth_headers,
            json={"title": "Updated Title"},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestDeleteEvent:
    """이벤트 삭제 테스트"""
    
    def test_delete_event_success(self, client, auth_headers):
        """이벤트 삭제 성공"""
        # 캘린더 및 이벤트 생성
        calendar_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "Test Calendar"},
        )
        calendar_id = calendar_response.json()["id"]
        
        start_at = datetime.utcnow() + timedelta(days=1)
        end_at = start_at + timedelta(hours=2)
        
        event_response = client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "To Delete",
                "start_at": start_at.isoformat(),
                "end_at": end_at.isoformat(),
            },
        )
        event_id = event_response.json()["id"]
        
        # 삭제
        response = client.delete(
            f"/api/v1/events/{event_id}",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_delete_event_not_found(self, client, auth_headers):
        """존재하지 않는 이벤트 삭제 실패 (404)"""
        response = client.delete(
            "/api/v1/events/nonexistent-id",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

