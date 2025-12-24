"""
사용자 관련 Pydantic 스키마
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole
from app.schemas.common import PageRequest, PageResponse


class UserBase(BaseModel):
    """사용자 기본 스키마"""
    email: EmailStr
    display_name: Optional[str] = None


class UserCreate(UserBase):
    """사용자 생성 요청"""
    password: str = Field(..., min_length=8, description="최소 8자 이상")


class UserUpdate(BaseModel):
    """사용자 수정 요청"""
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    """사용자 응답"""
    id: str
    role: UserRole
    is_active: bool
    is_banned: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserListRequest(PageRequest):
    """사용자 목록 조회 요청"""
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_banned: Optional[bool] = None
    created_from: Optional[datetime] = None
    created_to: Optional[datetime] = None


class UserListResponse(PageResponse[UserResponse]):
    """사용자 목록 응답"""
    pass


class UserBanRequest(BaseModel):
    """사용자 차단 요청"""
    reason: Optional[str] = Field(None, max_length=500, description="차단 사유")


class UserDeactivateRequest(BaseModel):
    """사용자 비활성화 요청"""
    reason: Optional[str] = Field(None, max_length=500, description="비활성화 사유")






