"""
관리자 관련 Pydantic 스키마
"""
from pydantic import BaseModel
from app.models.user import UserRole


class UpdateRoleRequest(BaseModel):
    """사용자 역할 변경 요청"""
    new_role: UserRole






