"""
인증 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import timedelta
import uuid
import time

from app.db.session import get_db
from app.db.redis import get_redis
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_expiry,
)
from app.core.dependencies import get_current_user
from app.core.firebase import verify_firebase_token, init_firebase
from app.core.google_oauth import get_google_oauth
from app.core.config import settings
from app.models.user import User, UserRole
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
    MeResponse,
    FirebaseLoginRequest,
)

router = APIRouter()


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=TokenResponse)
def signup(
    request: SignupRequest,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis),
):
    """
    회원가입
    
    - 이메일 중복 확인
    - 비밀번호 해시 저장
    - Access/Refresh 토큰 발급
    """
    # 이메일 중복 확인
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    
    # 비밀번호 해시
    hashed_password = hash_password(request.password)
    
    # 사용자 생성
    user = User(
        id=str(uuid.uuid4()),
        email=request.email,
        password=hashed_password,
        display_name=request.display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # 토큰 생성
    access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Refresh 토큰을 Redis에 저장
    refresh_expiry = get_token_expiry(refresh_token)
    if refresh_expiry:
        ttl = int((refresh_expiry.timestamp() - time.time()))
        redis_client.setex(
            f"refresh_token:{user.id}",
            ttl,
            refresh_token
        )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=TokenResponse)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis),
):
    """
    로그인
    
    - 이메일/비밀번호 검증
    - Access/Refresh 토큰 발급
    """
    # 사용자 조회
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # 비밀번호 검증
    if not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # 사용자 상태 확인
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    
    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is banned",
        )
    
    # 토큰 생성
    access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Refresh 토큰을 Redis에 저장
    refresh_expiry = get_token_expiry(refresh_token)
    if refresh_expiry:
        ttl = int((refresh_expiry.timestamp() - time.time()))
        redis_client.setex(
            f"refresh_token:{user.id}",
            ttl,
            refresh_token
        )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: RefreshRequest,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis),
):
    """
    토큰 갱신
    
    - Refresh 토큰 검증
    - Redis에서 토큰 확인
    - 새로운 Access/Refresh 토큰 발급
    """
    # 토큰 디코딩
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    # Redis에서 토큰 확인
    stored_token = redis_client.get(f"refresh_token:{user_id}")
    if not stored_token or stored_token != request.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    # 사용자 조회
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    # 기존 refresh 토큰 삭제
    redis_client.delete(f"refresh_token:{user_id}")
    
    # 새 토큰 생성
    access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # 새 Refresh 토큰 저장
    refresh_expiry = get_token_expiry(refresh_token)
    if refresh_expiry:
        ttl = int((refresh_expiry.timestamp() - time.time()))
        redis_client.setex(
            f"refresh_token:{user.id}",
            ttl,
            refresh_token
        )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user),
    redis_client = Depends(get_redis),
):
    """
    로그아웃
    
    - Refresh 토큰 무효화
    - Access 토큰 블랙리스트 추가 (선택적)
    """
    # Refresh 토큰 삭제
    redis_client.delete(f"refresh_token:{current_user.id}")
    
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=MeResponse)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    현재 로그인한 사용자 정보 조회
    
    - 인증 필요
    """
    return MeResponse(
        user=UserResponse(
            id=current_user.id,
            email=current_user.email,
            display_name=current_user.display_name,
            role=current_user.role,
        )
    )


# /auth/me는 users.py의 /users/me로 이동 (중복 제거)


@router.post("/firebase", response_model=TokenResponse)
def firebase_login(
    request: FirebaseLoginRequest,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis),
):
    """
    Firebase Auth 기반 소셜 로그인
    
    - Firebase ID 토큰 검증
    - 사용자 생성/갱신
    - 서버 JWT(access/refresh) 발급
    """
    # Firebase 초기화 확인
    firebase_app = init_firebase()
    if firebase_app is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase is not configured",
        )
    
    # Firebase 토큰 검증
    try:
        decoded_token = verify_firebase_token(request.idToken)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    
    # Firebase에서 사용자 정보 추출
    email = decoded_token.get("email")
    name = decoded_token.get("name") or decoded_token.get("display_name")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not found in Firebase token",
        )
    
    # 기존 사용자 조회 또는 생성
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        # 기존 사용자 정보 갱신
        if name and user.display_name != name:
            user.display_name = name
        db.commit()
        db.refresh(user)
    else:
        # 새 사용자 생성
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            password="",  # 소셜 로그인은 비밀번호 없음
            display_name=name,
            role=UserRole.USER,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # 서버 JWT 토큰 생성
    access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Refresh 토큰을 Redis에 저장
    refresh_expiry = get_token_expiry(refresh_token)
    if refresh_expiry:
        ttl = int((refresh_expiry.timestamp() - time.time()))
        redis_client.setex(
            f"refresh_token:{user.id}",
            ttl,
            refresh_token
        )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.get("/google")
async def google_login(request: Request):
    """
    Google OAuth 로그인 시작
    
    - Google 인증 페이지로 리다이렉트
    """
    # Google OAuth 설정 확인
    if not settings.GOOGLE_OAUTH_CLIENT_ID or not settings.GOOGLE_OAUTH_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured",
        )
    
    try:
        oauth = get_google_oauth()
        redirect_uri = settings.GOOGLE_OAUTH_REDIRECT_URI
        
        # Google 인증 URL 생성 및 리다이렉트
        return await oauth.google.authorize_redirect(request, redirect_uri)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate Google OAuth: {str(e)}",
        )


@router.get("/google/callback", response_model=TokenResponse)
async def google_callback(
    request: Request,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis),
):
    """
    Google OAuth 콜백
    
    - 인증 코드를 액세스 토큰으로 교환
    - 사용자 정보 가져오기
    - 사용자 생성/갱신
    - 서버 JWT 발급
    """
    # Google OAuth 설정 확인
    if not settings.GOOGLE_OAUTH_CLIENT_ID or not settings.GOOGLE_OAUTH_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured",
        )
    
    try:
        oauth = get_google_oauth()
        token = await oauth.google.authorize_access_token(request)
        
        # 사용자 정보 가져오기
        user_info = token.get("userinfo")
        if not user_info:
            # userinfo가 없으면 userinfo 엔드포인트에서 가져오기
            resp = await oauth.google.get("https://www.googleapis.com/oauth2/v2/userinfo", token=token)
            user_info = resp.json()
        
        email = user_info.get("email")
        name = user_info.get("name")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in Google user info",
            )
        
        # 기존 사용자 조회 또는 생성
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            # 기존 사용자 정보 갱신
            if name and user.display_name != name:
                user.display_name = name
            db.commit()
            db.refresh(user)
        else:
            # 새 사용자 생성
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                password="",  # 소셜 로그인은 비밀번호 없음
                display_name=name,
                role=UserRole.USER,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # 서버 JWT 토큰 생성
        access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value})
        refresh_token = create_refresh_token(data={"sub": user.id})
        
        # Refresh 토큰을 Redis에 저장
        refresh_expiry = get_token_expiry(refresh_token)
        if refresh_expiry:
            ttl = int((refresh_expiry.timestamp() - time.time()))
            redis_client.setex(
                f"refresh_token:{user.id}",
                ttl,
                refresh_token
            )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google OAuth callback failed: {str(e)}",
        )

