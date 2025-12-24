"""
DB 세션 의존성 주입 사용 예시
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User

router = APIRouter()


@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    """
    DB 세션 의존성 주입 사용 예시
    
    get_db()를 Depends()로 전달하면 FastAPI가 자동으로:
    1. 요청 시작 시 DB 세션 생성
    2. 함수 실행
    3. 요청 종료 시 DB 세션 자동 종료
    """
    users = db.query(User).all()
    return {"users": [{"id": user.id, "email": user.email} for user in users]}






