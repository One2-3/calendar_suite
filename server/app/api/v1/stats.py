"""
통계 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.session import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.calendar import Calendar
from app.models.event import Event
from app.models.task import Task, TaskStatus
from app.schemas.stats import (
    DailyStatsResponse,
    TopCalendarStatsResponse,
    StatsSummaryResponse,
)

router = APIRouter()


@router.get("/daily", response_model=List[DailyStatsResponse])
def get_daily_stats(
    days: int = Query(7, ge=1, le=30, description="조회할 일수"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """일일 통계 조회 (관리자 전용)"""
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days - 1)
    
    results = []
    current_date = start_date
    
    while current_date <= end_date:
        date_start = datetime.combine(current_date, datetime.min.time())
        date_end = datetime.combine(current_date, datetime.max.time())
        
        events_count = db.query(func.count(Event.id)).filter(
            and_(
                Event.created_at >= date_start,
                Event.created_at <= date_end,
            )
        ).scalar() or 0
        
        tasks_count = db.query(func.count(Task.id)).filter(
            and_(
                Task.created_at >= date_start,
                Task.created_at <= date_end,
            )
        ).scalar() or 0
        
        completed_tasks_count = db.query(func.count(Task.id)).filter(
            and_(
                Task.status == TaskStatus.COMPLETED,
                Task.completed_at >= date_start,
                Task.completed_at <= date_end,
            )
        ).scalar() or 0
        
        new_calendars_count = db.query(func.count(Calendar.id)).filter(
            and_(
                Calendar.created_at >= date_start,
                Calendar.created_at <= date_end,
            )
        ).scalar() or 0
        
        new_users_count = db.query(func.count(User.id)).filter(
            and_(
                User.created_at >= date_start,
                User.created_at <= date_end,
            )
        ).scalar() or 0
        
        results.append(DailyStatsResponse(
            date=current_date.isoformat(),
            events_count=events_count,
            tasks_count=tasks_count,
            completed_tasks_count=completed_tasks_count,
            new_calendars_count=new_calendars_count,
            new_users_count=new_users_count,
        ))
        
        current_date += timedelta(days=1)
    
    return results


@router.get("/top-calendars", response_model=List[TopCalendarStatsResponse])
def get_top_calendars(
    limit: int = Query(10, ge=1, le=50, description="조회할 개수"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """인기 캘린더 통계 (관리자 전용)"""
    # 각 캘린더별 이벤트/작업 수 계산
    calendar_stats = []
    calendars = db.query(Calendar).join(User).all()
    
    for calendar in calendars:
        events_count = db.query(func.count(Event.id)).filter(
            Event.calendar_id == calendar.id
        ).scalar() or 0
        
        tasks_count = db.query(func.count(Task.id)).filter(
            Task.calendar_id == calendar.id
        ).scalar() or 0
        
        total_items = events_count + tasks_count
        
        calendar_stats.append((
            calendar,
            calendar.user,
            events_count,
            tasks_count,
            total_items,
        ))
    
    # 정렬 및 제한
    calendar_stats.sort(key=lambda x: x[4], reverse=True)
    calendar_stats = calendar_stats[:limit]
    
    results = []
    for calendar, user, events_count, tasks_count, total_items in calendar_stats:
        results.append(TopCalendarStatsResponse(
            calendar_id=calendar.id,
            calendar_title=calendar.title,
            user_id=user.id,
            user_email=user.email,
            events_count=events_count,
            tasks_count=tasks_count,
            total_items=total_items,
        ))
    
    return results


@router.get("/summary", response_model=StatsSummaryResponse)
def get_stats_summary(
    date_from: Optional[str] = Query(None, description="시작 날짜 (ISO format)"),
    date_to: Optional[str] = Query(None, description="종료 날짜 (ISO format)"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """통계 요약 (관리자 전용)"""
    query_filters = []
    
    if date_from:
        date_from_dt = datetime.fromisoformat(date_from)
        query_filters.append(User.created_at >= date_from_dt)
    if date_to:
        date_to_dt = datetime.fromisoformat(date_to)
        query_filters.append(User.created_at <= date_to_dt)
    
    if query_filters:
        total_users = db.query(func.count(User.id)).filter(and_(*query_filters)).scalar() or 0
        active_users_count = db.query(func.count(User.id)).filter(
            and_(User.is_active == True, *query_filters)
        ).scalar() or 0
    else:
        total_users = db.query(func.count(User.id)).scalar() or 0
        active_users_count = db.query(func.count(User.id)).filter(
            User.is_active == True
        ).scalar() or 0
    
    total_calendars = db.query(func.count(Calendar.id)).scalar() or 0
    total_events = db.query(func.count(Event.id)).scalar() or 0
    total_tasks = db.query(func.count(Task.id)).scalar() or 0
    completed_tasks_count = db.query(func.count(Task.id)).filter(
        Task.status == TaskStatus.COMPLETED
    ).scalar() or 0
    
    # 다가오는 이벤트 (7일 이내)
    upcoming_events_count = db.query(func.count(Event.id)).filter(
        Event.start_at >= datetime.utcnow(),
        Event.start_at <= datetime.utcnow() + timedelta(days=7),
    ).scalar() or 0
    
    return StatsSummaryResponse(
        total_users=total_users,
        total_calendars=total_calendars,
        total_events=total_events,
        total_tasks=total_tasks,
        active_users_count=active_users_count,
        completed_tasks_count=completed_tasks_count,
        upcoming_events_count=upcoming_events_count,
        date_from=datetime.fromisoformat(date_from) if date_from else None,
        date_to=datetime.fromisoformat(date_to) if date_to else None,
    )

