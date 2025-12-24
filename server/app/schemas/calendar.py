"""
캘린더 관련 Pydantic 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.common import PageRequest, PageResponse


class CalendarBase(BaseModel):
    """캘린더 기본 스키마"""
    title: str = Field(..., max_length=255, description="캘린더 제목")
    description: Optional[str] = Field(None, max_length=1000, description="설명")
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$", description="HEX 색상 코드")


class CalendarCreate(CalendarBase):
    """캘린더 생성 요청"""
    pass


class CalendarUpdate(BaseModel):
    """캘린더 수정 요청"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")


class CalendarResponse(CalendarBase):
    """캘린더 응답"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CalendarListRequest(PageRequest):
    """캘린더 목록 조회 요청"""
    user_id: Optional[str] = None
    created_from: Optional[datetime] = None
    created_to: Optional[datetime] = None


class CalendarListResponse(PageResponse[CalendarResponse]):
    """캘린더 목록 응답"""
    pass






