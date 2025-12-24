"""
Task 모델
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Enum, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base import Base


class TaskStatus(str, enum.Enum):
    """작업 상태"""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Task(Base):
    """작업 모델"""
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, index=True)
    calendar_id = Column(String(36), ForeignKey("calendars.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    due_at = Column(DateTime, nullable=True, index=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False, index=True)
    priority = Column(String(20), nullable=True, index=True)  # LOW, MEDIUM, HIGH
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # 관계
    calendar = relationship("Calendar", back_populates="tasks")

    # 복합 인덱스 (검색/정렬 최적화)
    __table_args__ = (
        Index("idx_task_calendar_due", "calendar_id", "due_at"),
        Index("idx_task_calendar_status", "calendar_id", "status"),
        Index("idx_task_due_status", "due_at", "status"),
    )






