"""
사용자 CRUD 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import uuid

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_admin
from app.core.pagination import apply_pagination, create_page_response
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListRequest,
    UserListResponse,
)

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """현재 사용자 정보 조회"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_banned=current_user.is_banned,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.put("/me", response_model=UserResponse)
def update_me(
    request: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """현재 사용자 정보 수정"""
    if request.display_name is not None:
        current_user.display_name = request.display_name
    if request.email is not None and request.email != current_user.email:
        # 이메일 중복 확인
        existing = db.query(User).filter(User.email == request.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        current_user.email = request.email
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_banned=current_user.is_banned,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.get("", response_model=UserListResponse)
def get_users(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    sort: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    is_banned: Optional[bool] = Query(None),
    created_from: Optional[str] = Query(None),
    created_to: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """사용자 목록 조회 (관리자 전용)"""
    from datetime import datetime
    
    page_request = UserListRequest(
        page=page,
        size=size,
        sort=sort,
        keyword=keyword,
        role=role,
        is_active=is_active,
        is_banned=is_banned,
        created_from=datetime.fromisoformat(created_from) if created_from else None,
        created_to=datetime.fromisoformat(created_to) if created_to else None,
    )
    
    query = db.query(User)
    
    # 필터 적용
    if page_request.role:
        query = query.filter(User.role == page_request.role)
    if page_request.is_active is not None:
        query = query.filter(User.is_active == page_request.is_active)
    if page_request.is_banned is not None:
        query = query.filter(User.is_banned == page_request.is_banned)
    if page_request.keyword:
        query = query.filter(
            or_(
                User.email.contains(page_request.keyword),
                User.display_name.contains(page_request.keyword),
            )
        )
    if page_request.created_from:
        query = query.filter(User.created_at >= page_request.created_from)
    if page_request.created_to:
        query = query.filter(User.created_at <= page_request.created_to)
    
    # 페이징 적용
    paginated_query, total_count = apply_pagination(query, page_request, "created_at,DESC")
    
    users = paginated_query.all()
    content = [
        UserResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            role=user.role,
            is_active=user.is_active,
            is_banned=user.is_banned,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
        for user in users
    ]
    
    return UserListResponse(**create_page_response(
        content=content,
        page=page_request.page,
        size=page_request.size,
        total_elements=total_count,
        sort=page_request.sort,
    ))


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """사용자 상세 조회 (관리자 전용)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
        is_banned=user.is_banned,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    request: UserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """사용자 정보 수정 (관리자 전용)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if request.display_name is not None:
        user.display_name = request.display_name
    if request.email is not None and request.email != user.email:
        existing = db.query(User).filter(User.email == request.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        user.email = request.email
    
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
        is_banned=user.is_banned,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )






