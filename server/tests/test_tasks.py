"""
작업 관련 테스트
"""
import pytest
from fastapi import status
from datetime import datetime, timedelta
from app.models.task import TaskStatus


class TestCreateTask:
    """작업 생성 테스트"""
    
    def test_create_task_success(self, client, auth_headers):
        """작업 생성 성공"""
        # 캘린더 생성
        calendar_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "Test Calendar"},
        )
        calendar_id = calendar_response.json()["id"]
        
        # 작업 생성
        response = client.post(
            "/api/v1/tasks",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "Test Task",
                "status": TaskStatus.PENDING.value,
                "priority": "HIGH",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "Test Task"
    
    def test_create_task_calendar_not_found(self, client, auth_headers):
        """존재하지 않는 캘린더에 작업 생성 실패 (404)"""
        response = client.post(
            "/api/v1/tasks",
            headers=auth_headers,
            json={
                "calendar_id": "nonexistent-id",
                "title": "Test Task",
            },
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_create_task_unauthorized(self, client):
        """인증 없이 작업 생성 실패 (403)"""
        response = client.post(
            "/api/v1/tasks",
            json={"title": "Test Task"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetTasks:
    """작업 목록 조회 테스트"""
    
    def test_get_tasks_success(self, client, auth_headers):
        """작업 목록 조회 성공"""
        response = client.get("/api/v1/tasks", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "content" in data
    
    def test_get_tasks_unauthorized(self, client):
        """인증 없이 조회 실패 (403)"""
        response = client.get("/api/v1/tasks")
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetTask:
    """작업 상세 조회 테스트"""
    
    def test_get_task_success(self, client, auth_headers):
        """작업 상세 조회 성공"""
        # 캘린더 및 작업 생성
        calendar_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "Test Calendar"},
        )
        calendar_id = calendar_response.json()["id"]
        
        task_response = client.post(
            "/api/v1/tasks",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "Test Task",
            },
        )
        task_id = task_response.json()["id"]
        
        # 조회
        response = client.get(
            f"/api/v1/tasks/{task_id}",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == task_id
    
    def test_get_task_not_found(self, client, auth_headers):
        """존재하지 않는 작업 조회 실패 (404)"""
        response = client.get(
            "/api/v1/tasks/nonexistent-id",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestUpdateTask:
    """작업 수정 테스트"""
    
    def test_update_task_success(self, client, auth_headers):
        """작업 수정 성공"""
        # 캘린더 및 작업 생성
        calendar_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "Test Calendar"},
        )
        calendar_id = calendar_response.json()["id"]
        
        task_response = client.post(
            "/api/v1/tasks",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "Original Title",
            },
        )
        task_id = task_response.json()["id"]
        
        # 수정
        response = client.put(
            f"/api/v1/tasks/{task_id}",
            headers=auth_headers,
            json={
                "title": "Updated Title",
                "status": TaskStatus.COMPLETED.value,
            },
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["status"] == TaskStatus.COMPLETED.value
    
    def test_update_task_not_found(self, client, auth_headers):
        """존재하지 않는 작업 수정 실패 (404)"""
        response = client.put(
            "/api/v1/tasks/nonexistent-id",
            headers=auth_headers,
            json={"title": "Updated Title"},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestDeleteTask:
    """작업 삭제 테스트"""
    
    def test_delete_task_success(self, client, auth_headers):
        """작업 삭제 성공"""
        # 캘린더 및 작업 생성
        calendar_response = client.post(
            "/api/v1/calendars",
            headers=auth_headers,
            json={"title": "Test Calendar"},
        )
        calendar_id = calendar_response.json()["id"]
        
        task_response = client.post(
            "/api/v1/tasks",
            headers=auth_headers,
            json={
                "calendar_id": calendar_id,
                "title": "To Delete",
            },
        )
        task_id = task_response.json()["id"]
        
        # 삭제
        response = client.delete(
            f"/api/v1/tasks/{task_id}",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_delete_task_not_found(self, client, auth_headers):
        """존재하지 않는 작업 삭제 실패 (404)"""
        response = client.delete(
            "/api/v1/tasks/nonexistent-id",
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

