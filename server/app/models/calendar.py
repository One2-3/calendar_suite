"""
Calendar 모델
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base


class Calendar(Base):
    """캘린더 모델"""
    __tablename__ = "calendars"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    color = Column(String(7), nullable=True)  # HEX 색상 코드
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # 관계
    user = relationship("User", back_populates="calendars")
    events = relationship("Event", back_populates="calendar", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="calendar", cascade="all, delete-orphan")

    # 복합 인덱스
    __table_args__ = (
        Index("idx_calendar_user_title", "user_id", "title"),
    )






