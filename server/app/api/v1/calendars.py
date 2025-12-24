"""
캘린더 CRUD 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime
import uuid

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.core.pagination import apply_pagination, create_page_response
from app.models.calendar import Calendar
from app.models.user import User
from app.schemas.calendar import (
    CalendarCreate,
    CalendarUpdate,
    CalendarResponse,
    CalendarListRequest,
    CalendarListResponse,
)

router = APIRouter()


@router.post("", response_model=CalendarResponse, status_code=status.HTTP_201_CREATED)
def create_calendar(
    request: CalendarCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """캘린더 생성"""
    calendar = Calendar(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=request.title,
        description=request.description,
        color=request.color,
    )
    db.add(calendar)
    db.commit()
    db.refresh(calendar)
    
    return CalendarResponse(
        id=calendar.id,
        user_id=calendar.user_id,
        title=calendar.title,
        description=calendar.description,
        color=calendar.color,
        created_at=calendar.created_at,
        updated_at=calendar.updated_at,
    )


@router.get("", response_model=CalendarListResponse)
def get_calendars(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    sort: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    created_from: Optional[str] = Query(None),
    created_to: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """캘린더 목록 조회"""
    page_request = CalendarListRequest(
        page=page,
        size=size,
        sort=sort,
        keyword=keyword,
        user_id=user_id or current_user.id,  # 기본값: 현재 사용자
        created_from=datetime.fromisoformat(created_from) if created_from else None,
        created_to=datetime.fromisoformat(created_to) if created_to else None,
    )
    
    query = db.query(Calendar)
    
    # 권한 확인: 자신의 캘린더만 조회 가능 (관리자는 모든 캘린더 조회 가능)
    if current_user.role.value != "ADMIN":
        query = query.filter(Calendar.user_id == current_user.id)
    elif page_request.user_id:
        query = query.filter(Calendar.user_id == page_request.user_id)
    
    # 필터 적용
    if page_request.keyword:
        query = query.filter(
            or_(
                Calendar.title.contains(page_request.keyword),
                Calendar.description.contains(page_request.keyword),
            )
        )
    if page_request.created_from:
        query = query.filter(Calendar.created_at >= page_request.created_from)
    if page_request.created_to:
        query = query.filter(Calendar.created_at <= page_request.created_to)
    
    paginated_query, total_count = apply_pagination(query, page_request, "created_at,DESC")
    calendars = paginated_query.all()
    
    content = [
        CalendarResponse(
            id=cal.id,
            user_id=cal.user_id,
            title=cal.title,
            description=cal.description,
            color=cal.color,
            created_at=cal.created_at,
            updated_at=cal.updated_at,
        )
        for cal in calendars
    ]
    
    return CalendarListResponse(**create_page_response(
        content=content,
        page=page_request.page,
        size=page_request.size,
        total_elements=total_count,
        sort=page_request.sort,
    ))


@router.get("/{calendar_id}", response_model=CalendarResponse)
def get_calendar(
    calendar_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """캘린더 상세 조회"""
    calendar = db.query(Calendar).filter(Calendar.id == calendar_id).first()
    if not calendar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar not found",
        )
    
    # 권한 확인
    if calendar.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return CalendarResponse(
        id=calendar.id,
        user_id=calendar.user_id,
        title=calendar.title,
        description=calendar.description,
        color=calendar.color,
        created_at=calendar.created_at,
        updated_at=calendar.updated_at,
    )


@router.put("/{calendar_id}", response_model=CalendarResponse)
def update_calendar(
    calendar_id: str,
    request: CalendarUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """캘린더 수정"""
    calendar = db.query(Calendar).filter(Calendar.id == calendar_id).first()
    if not calendar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar not found",
        )
    
    # 권한 확인
    if calendar.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    if request.title is not None:
        calendar.title = request.title
    if request.description is not None:
        calendar.description = request.description
    if request.color is not None:
        calendar.color = request.color
    
    db.commit()
    db.refresh(calendar)
    
    return CalendarResponse(
        id=calendar.id,
        user_id=calendar.user_id,
        title=calendar.title,
        description=calendar.description,
        color=calendar.color,
        created_at=calendar.created_at,
        updated_at=calendar.updated_at,
    )


@router.delete("/{calendar_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_calendar(
    calendar_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """캘린더 삭제"""
    calendar = db.query(Calendar).filter(Calendar.id == calendar_id).first()
    if not calendar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar not found",
        )
    
    # 권한 확인
    if calendar.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    db.delete(calendar)
    db.commit()
    return None






