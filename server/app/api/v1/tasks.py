"""
작업 CRUD 엔드포인트
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
from app.models.task import Task, TaskStatus
from app.models.calendar import Calendar
from app.models.user import User
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskListRequest,
    TaskListResponse,
)

router = APIRouter()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    request: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """작업 생성"""
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
    
    task = Task(
        id=str(uuid.uuid4()),
        calendar_id=request.calendar_id,
        title=request.title,
        description=request.description,
        due_at=request.due_at,
        status=request.status,
        priority=request.priority,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return TaskResponse(
        id=task.id,
        calendar_id=task.calendar_id,
        title=task.title,
        description=task.description,
        due_at=task.due_at,
        status=task.status,
        priority=task.priority,
        completed_at=task.completed_at,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.get("", response_model=TaskListResponse)
def get_tasks(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    sort: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    calendar_id: Optional[str] = Query(None),
    status: Optional[TaskStatus] = Query(None),
    priority: Optional[str] = Query(None),
    due_from: Optional[str] = Query(None),
    due_to: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """작업 목록 조회"""
    page_request = TaskListRequest(
        page=page,
        size=size,
        sort=sort,
        keyword=keyword,
        calendar_id=calendar_id,
        status=status,
        priority=priority,
        due_from=datetime.fromisoformat(due_from) if due_from else None,
        due_to=datetime.fromisoformat(due_to) if due_to else None,
    )
    
    query = db.query(Task).join(Calendar)
    
    # 권한 확인
    if current_user.role.value != "ADMIN":
        query = query.filter(Calendar.user_id == current_user.id)
    
    # 필터 적용
    if page_request.calendar_id:
        query = query.filter(Task.calendar_id == page_request.calendar_id)
    if page_request.status:
        query = query.filter(Task.status == page_request.status)
    if page_request.priority:
        query = query.filter(Task.priority == page_request.priority)
    if page_request.keyword:
        query = query.filter(
            or_(
                Task.title.contains(page_request.keyword),
                Task.description.contains(page_request.keyword),
            )
        )
    if page_request.due_from:
        query = query.filter(Task.due_at >= page_request.due_from)
    if page_request.due_to:
        query = query.filter(Task.due_at <= page_request.due_to)
    
    paginated_query, total_count = apply_pagination(query, page_request, "due_at,ASC")
    tasks = paginated_query.all()
    
    content = [
        TaskResponse(
            id=task.id,
            calendar_id=task.calendar_id,
            title=task.title,
            description=task.description,
            due_at=task.due_at,
            status=task.status,
            priority=task.priority,
            completed_at=task.completed_at,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )
        for task in tasks
    ]
    
    return TaskListResponse(**create_page_response(
        content=content,
        page=page_request.page,
        size=page_request.size,
        total_elements=total_count,
        sort=page_request.sort,
    ))


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """작업 상세 조회"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    # 권한 확인
    calendar = db.query(Calendar).filter(Calendar.id == task.calendar_id).first()
    if calendar.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return TaskResponse(
        id=task.id,
        calendar_id=task.calendar_id,
        title=task.title,
        description=task.description,
        due_at=task.due_at,
        status=task.status,
        priority=task.priority,
        completed_at=task.completed_at,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    request: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """작업 수정"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    # 권한 확인
    calendar = db.query(Calendar).filter(Calendar.id == task.calendar_id).first()
    if calendar.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    if request.title is not None:
        task.title = request.title
    if request.description is not None:
        task.description = request.description
    if request.due_at is not None:
        task.due_at = request.due_at
    if request.status is not None:
        task.status = request.status
        # 완료 시 completed_at 설정
        if request.status == TaskStatus.COMPLETED and not task.completed_at:
            task.completed_at = datetime.utcnow()
        elif request.status != TaskStatus.COMPLETED:
            task.completed_at = None
    if request.priority is not None:
        task.priority = request.priority
    
    db.commit()
    db.refresh(task)
    
    return TaskResponse(
        id=task.id,
        calendar_id=task.calendar_id,
        title=task.title,
        description=task.description,
        due_at=task.due_at,
        status=task.status,
        priority=task.priority,
        completed_at=task.completed_at,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """작업 삭제"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    # 권한 확인
    calendar = db.query(Calendar).filter(Calendar.id == task.calendar_id).first()
    if calendar.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    db.delete(task)
    db.commit()
    return None






