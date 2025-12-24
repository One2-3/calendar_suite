"""
작업 관련 Pydantic 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.task import TaskStatus
from app.schemas.common import PageRequest, PageResponse


class TaskBase(BaseModel):
    """작업 기본 스키마"""
    title: str = Field(..., max_length=255, description="작업 제목")
    description: Optional[str] = Field(None, description="설명")
    due_at: Optional[datetime] = Field(None, description="마감일")
    status: TaskStatus = Field(TaskStatus.PENDING, description="상태")
    priority: Optional[str] = Field(None, pattern="^(LOW|MEDIUM|HIGH)$", description="우선순위")


class TaskCreate(TaskBase):
    """작업 생성 요청"""
    calendar_id: str = Field(..., description="캘린더 ID")


class TaskUpdate(BaseModel):
    """작업 수정 요청"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    due_at: Optional[datetime] = None
    status: Optional[TaskStatus] = None
    priority: Optional[str] = Field(None, pattern="^(LOW|MEDIUM|HIGH)$")


class TaskResponse(TaskBase):
    """작업 응답"""
    id: str
    calendar_id: str
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskListRequest(PageRequest):
    """작업 목록 조회 요청"""
    calendar_id: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[str] = Field(None, pattern="^(LOW|MEDIUM|HIGH)$")
    due_from: Optional[datetime] = None
    due_to: Optional[datetime] = None


class TaskListResponse(PageResponse[TaskResponse]):
    """작업 목록 응답"""
    pass






