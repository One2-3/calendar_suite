"""
이벤트 CRUD 엔드포인트
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
from app.models.event import Event
from app.models.calendar import Calendar
from app.models.user import User
from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventListRequest,
    EventListResponse,
)

router = APIRouter()


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    request: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """이벤트 생성"""
    # 캘린더 소유권 확인
    calendar = db.query(Calendar).filter(Calendar.id == request.calendar_id).first()
    if not calendar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar not found",
        )
    
    if calendar.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # 날짜 검증
    if request.end_at < request.start_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date",
        )
    
    event = Event(
        id=str(uuid.uuid4()),
        calendar_id=request.calendar_id,
        title=request.title,
        description=request.description,
        start_at=request.start_at,
        end_at=request.end_at,
        location=request.location,
        is_all_day=request.is_all_day,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return EventResponse(
        id=event.id,
        calendar_id=event.calendar_id,
        title=event.title,
        description=event.description,
        start_at=event.start_at,
        end_at=event.end_at,
        location=event.location,
        is_all_day=event.is_all_day,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.get("", response_model=EventListResponse)
def get_events(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    sort: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    calendar_id: Optional[str] = Query(None),
    start_from: Optional[str] = Query(None),
    start_to: Optional[str] = Query(None),
    end_from: Optional[str] = Query(None),
    end_to: Optional[str] = Query(None),
    is_all_day: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """이벤트 목록 조회"""
    page_request = EventListRequest(
        page=page,
        size=size,
        sort=sort,
        keyword=keyword,
        calendar_id=calendar_id,
        start_from=datetime.fromisoformat(start_from) if start_from else None,
        start_to=datetime.fromisoformat(start_to) if start_to else None,
        end_from=datetime.fromisoformat(end_from) if end_from else None,
        end_to=datetime.fromisoformat(end_to) if end_to else None,
        is_all_day=is_all_day,
    )
    
    query = db.query(Event).join(Calendar)
    
    # 권한 확인: 자신의 캘린더 이벤트만 조회 가능
    if current_user.role.value != "ADMIN":
        query = query.filter(Calendar.user_id == current_user.id)
    
    # 필터 적용
    if page_request.calendar_id:
        query = query.filter(Event.calendar_id == page_request.calendar_id)
    if page_request.keyword:
        query = query.filter(
            or_(
                Event.title.contains(page_request.keyword),
                Event.description.contains(page_request.keyword),
                Event.location.contains(page_request.keyword),
            )
        )
    if page_request.start_from:
        query = query.filter(Event.start_at >= page_request.start_from)
    if page_request.start_to:
        query = query.filter(Event.start_at <= page_request.start_to)
    if page_request.end_from:
        query = query.filter(Event.end_at >= page_request.end_from)
    if page_request.end_to:
        query = query.filter(Event.end_at <= page_request.end_to)
    if page_request.is_all_day is not None:
        query = query.filter(Event.is_all_day == page_request.is_all_day)
    
    paginated_query, total_count = apply_pagination(query, page_request, "start_at,ASC")
    events = paginated_query.all()
    
    content = [
        EventResponse(
            id=event.id,
            calendar_id=event.calendar_id,
            title=event.title,
            description=event.description,
            start_at=event.start_at,
            end_at=event.end_at,
            location=event.location,
            is_all_day=event.is_all_day,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )
        for event in events
    ]
    
    return EventListResponse(**create_page_response(
        content=content,
        page=page_request.page,
        size=page_request.size,
        total_elements=total_count,
        sort=page_request.sort,
    ))


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """이벤트 상세 조회"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    
    # 권한 확인
    calendar = db.query(Calendar).filter(Calendar.id == event.calendar_id).first()
    if calendar.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return EventResponse(
        id=event.id,
        calendar_id=event.calendar_id,
        title=event.title,
        description=event.description,
        start_at=event.start_at,
        end_at=event.end_at,
        location=event.location,
        is_all_day=event.is_all_day,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    request: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """이벤트 수정"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    
    # 권한 확인
    calendar = db.query(Calendar).filter(Calendar.id == event.calendar_id).first()
    if calendar.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # 날짜 검증
    start_at = request.start_at if request.start_at else event.start_at
    end_at = request.end_at if request.end_at else event.end_at
    if end_at < start_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date",
        )
    
    if request.title is not None:
        event.title = request.title
    if request.description is not None:
        event.description = request.description
    if request.start_at is not None:
        event.start_at = request.start_at
    if request.end_at is not None:
        event.end_at = request.end_at
    if request.location is not None:
        event.location = request.location
    if request.is_all_day is not None:
        event.is_all_day = request.is_all_day
    
    db.commit()
    db.refresh(event)
    
    return EventResponse(
        id=event.id,
        calendar_id=event.calendar_id,
        title=event.title,
        description=event.description,
        start_at=event.start_at,
        end_at=event.end_at,
        location=event.location,
        is_all_day=event.is_all_day,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """이벤트 삭제"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    
    # 권한 확인
    calendar = db.query(Calendar).filter(Calendar.id == event.calendar_id).first()
    if calendar.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    db.delete(event)
    db.commit()
    return None






