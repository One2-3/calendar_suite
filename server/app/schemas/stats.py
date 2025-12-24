"""
통계 관련 Pydantic 스키마
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DailyStatsResponse(BaseModel):
    """일일 통계 응답"""
    date: str
    events_count: int
    tasks_count: int
    completed_tasks_count: int
    new_calendars_count: int
    new_users_count: int


class TopCalendarStatsResponse(BaseModel):
    """인기 캘린더 통계 응답"""
    calendar_id: str
    calendar_title: str
    user_id: str
    user_email: str
    events_count: int
    tasks_count: int
    total_items: int


class StatsSummaryResponse(BaseModel):
    """통계 요약 응답"""
    total_users: int
    total_calendars: int
    total_events: int
    total_tasks: int
    active_users_count: int
    completed_tasks_count: int
    upcoming_events_count: int
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None






