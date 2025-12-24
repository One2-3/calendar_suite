"""
Event 모델
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base


class Event(Base):
    """이벤트 모델"""
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, index=True)
    calendar_id = Column(String(36), ForeignKey("calendars.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    start_at = Column(DateTime, nullable=False, index=True)
    end_at = Column(DateTime, nullable=False, index=True)
    location = Column(String(500), nullable=True)
    is_all_day = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # 관계
    calendar = relationship("Calendar", back_populates="events")

    # 복합 인덱스 (검색/정렬 최적화)
    __table_args__ = (
        Index("idx_event_calendar_start", "calendar_id", "start_at"),
        Index("idx_event_calendar_end", "calendar_id", "end_at"),
        Index("idx_event_start_end", "start_at", "end_at"),
    )






