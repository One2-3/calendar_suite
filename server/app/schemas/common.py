"""
공통 스키마 (페이징, 필터링, 정렬)
"""
from typing import Optional, List, Generic, TypeVar, Any
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar('T')


class SortParam(BaseModel):
    """정렬 파라미터"""
    field: str = Field(..., description="정렬 필드")
    direction: str = Field(..., pattern="^(ASC|DESC)$", description="정렬 방향 (ASC/DESC)")


class PageRequest(BaseModel):
    """페이징 요청"""
    page: int = Field(0, ge=0, description="페이지 번호 (0부터 시작)")
    size: int = Field(20, ge=1, le=100, description="페이지 크기 (1-100)")
    sort: Optional[str] = Field(None, description="정렬 (예: 'field,ASC' 또는 'field,DESC')")
    keyword: Optional[str] = Field(None, max_length=100, description="검색 키워드")


class DateRangeFilter(BaseModel):
    """날짜 범위 필터"""
    date_from: Optional[datetime] = Field(None, description="시작 날짜")
    date_to: Optional[datetime] = Field(None, description="종료 날짜")


class PageResponse(BaseModel, Generic[T]):
    """페이징 응답"""
    content: List[T]
    page: int
    size: int
    total_elements: int
    total_pages: int
    sort: Optional[str] = None

    class Config:
        from_attributes = True






