"""
인증 관련 Pydantic 스키마
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.models.user import UserRole


class SignupRequest(BaseModel):
    """회원가입 요청"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="최소 8자 이상")
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    """로그인 요청"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """토큰 응답"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """토큰 갱신 요청"""
    refresh_token: str


class UserResponse(BaseModel):
    """사용자 정보 응답"""
    id: str
    email: str
    display_name: Optional[str]
    role: UserRole

    class Config:
        from_attributes = True


class MeResponse(BaseModel):
    """내 정보 응답"""
    user: UserResponse


class FirebaseLoginRequest(BaseModel):
    """Firebase 로그인 요청"""
    idToken: str

