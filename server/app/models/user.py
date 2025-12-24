"""
User 모델
"""
from sqlalchemy import Column, String, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base import Base


class UserRole(str, enum.Enum):
    """사용자 역할"""
    USER = "USER"
    ADMIN = "ADMIN"


class User(Base):
    """사용자 모델"""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)  # bcrypt 해시된 비밀번호
    display_name = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)  # 활성화 여부
    is_banned = Column(Boolean, default=False, nullable=False, index=True)  # 차단 여부
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # 관계
    calendars = relationship("Calendar", back_populates="user", cascade="all, delete-orphan")

