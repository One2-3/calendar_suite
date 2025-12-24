"""
시드 데이터 생성 스크립트

사용법:
    python scripts/seed.py
    또는
    docker compose exec server python scripts/seed.py
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone
import random
import uuid

# Windows 콘솔 인코딩 설정
if sys.platform == "win32":
    os.system("chcp 65001 >nul 2>&1")  # UTF-8로 설정
    sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

# 프로젝트 루트를 sys.path에 추가
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from faker import Faker
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.calendar import Calendar
from app.models.event import Event
from app.models.task import Task, TaskStatus

fake = Faker("ko_KR")  # 한국어 로케일 사용


def generate_users(db: Session, count: int = 20) -> list[User]:
    """사용자 데이터 생성"""
    print(f"생성 중: Users {count}개...")
    users = []
    
    for i in range(count):
        user = User(
            id=str(uuid.uuid4()),
            email=fake.unique.email(),
            display_name=fake.name(),
            role=UserRole.ADMIN if i < 2 else UserRole.USER,  # 처음 2명은 ADMIN
            created_at=fake.date_time_between(start_date="-1y", end_date="now"),
            updated_at=datetime.now(timezone.utc),
        )
        users.append(user)
        db.add(user)
    
    db.commit()
    print(f"[OK] Users {count}개 생성 완료")
    return users


def generate_calendars(db: Session, users: list[User], count: int = 40) -> list[Calendar]:
    """캘린더 데이터 생성"""
    print(f"생성 중: Calendars {count}개...")
    calendars = []
    colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE"]
    
    for i in range(count):
        user = random.choice(users)
        calendar = Calendar(
            id=str(uuid.uuid4()),
            user_id=user.id,
            title=fake.sentence(nb_words=3).rstrip('.'),
            description=fake.text(max_nb_chars=200) if random.random() > 0.3 else None,
            color=random.choice(colors),
            created_at=fake.date_time_between(start_date="-1y", end_date="now"),
            updated_at=datetime.now(timezone.utc),
        )
        calendars.append(calendar)
        db.add(calendar)
    
    db.commit()
    print(f"[OK] Calendars {count}개 생성 완료")
    return calendars


def generate_events(db: Session, calendars: list[Calendar], count: int = 100) -> list[Event]:
    """이벤트 데이터 생성"""
    print(f"생성 중: Events {count}개...")
    events = []
    
    for i in range(count):
        calendar = random.choice(calendars)
        
        # 시작 시간 생성 (과거부터 미래까지)
        start_at = fake.date_time_between(start_date="-6m", end_date="+6m")
        
        # 종료 시간 생성 (시작 시간 이후)
        if random.random() > 0.2:  # 80%는 종료 시간 있음
            duration_hours = random.choice([1, 2, 3, 4, 8, 24])
            end_at = start_at + timedelta(hours=duration_hours)
            is_all_day = False
        else:  # 20%는 종일 이벤트
            end_at = start_at + timedelta(days=1)
            is_all_day = True
        
        event = Event(
            id=str(uuid.uuid4()),
            calendar_id=calendar.id,
            title=fake.sentence(nb_words=4).rstrip('.'),
            description=fake.text(max_nb_chars=500) if random.random() > 0.4 else None,
            start_at=start_at,
            end_at=end_at,
            location=fake.address() if random.random() > 0.5 else None,
            is_all_day=is_all_day,
            created_at=fake.date_time_between(start_date="-1y", end_date="now"),
            updated_at=datetime.now(timezone.utc),
        )
        events.append(event)
        db.add(event)
    
    db.commit()
    print(f"[OK] Events {count}개 생성 완료")
    return events


def generate_tasks(db: Session, calendars: list[Calendar], count: int = 100) -> list[Task]:
    """작업 데이터 생성"""
    print(f"생성 중: Tasks {count}개...")
    tasks = []
    priorities = ["LOW", "MEDIUM", "HIGH"]
    statuses = [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED]
    
    for i in range(count):
        calendar = random.choice(calendars)
        status = random.choice(statuses)
        
        # 마감일 생성 (과거부터 미래까지)
        due_at = fake.date_time_between(start_date="-3m", end_date="+3m") if random.random() > 0.2 else None
        
        # 완료된 작업은 completed_at 설정
        completed_at = None
        if status == TaskStatus.COMPLETED and due_at:
            completed_at = fake.date_time_between(start_date=due_at - timedelta(days=7), end_date=due_at)
        
        task = Task(
            id=str(uuid.uuid4()),
            calendar_id=calendar.id,
            title=fake.sentence(nb_words=4).rstrip('.'),
            description=fake.text(max_nb_chars=300) if random.random() > 0.3 else None,
            due_at=due_at,
            completed_at=completed_at,
            status=status,
            priority=random.choice(priorities) if random.random() > 0.3 else None,
            created_at=fake.date_time_between(start_date="-1y", end_date="now"),
            updated_at=datetime.now(timezone.utc),
        )
        tasks.append(task)
        db.add(task)
    
    db.commit()
    print(f"[OK] Tasks {count}개 생성 완료")
    return tasks


def verify_data(db: Session):
    """생성된 데이터 검증"""
    print("\n=== 데이터 검증 ===")
    user_count = db.query(User).count()
    calendar_count = db.query(Calendar).count()
    event_count = db.query(Event).count()
    task_count = db.query(Task).count()
    total_count = user_count + calendar_count + event_count + task_count
    
    print(f"Users: {user_count}개")
    print(f"Calendars: {calendar_count}개")
    print(f"Events: {event_count}개")
    print(f"Tasks: {task_count}개")
    print(f"총계: {total_count}개")
    
    # 샘플 데이터 출력
    print("\n=== 샘플 데이터 ===")
    sample_user = db.query(User).first()
    if sample_user:
        print(f"샘플 User: {sample_user.email} ({sample_user.display_name})")
    
    sample_calendar = db.query(Calendar).first()
    if sample_calendar:
        print(f"샘플 Calendar: {sample_calendar.title} (User: {sample_calendar.user_id})")
    
    sample_event = db.query(Event).first()
    if sample_event:
        print(f"샘플 Event: {sample_event.title} (시작: {sample_event.start_at})")
    
    sample_task = db.query(Task).first()
    if sample_task:
        print(f"샘플 Task: {sample_task.title} (상태: {sample_task.status.value})")


def main():
    """메인 함수"""
    import os
    
    print("=" * 50)
    print("시드 데이터 생성 시작")
    print("=" * 50)
    
    db: Session = SessionLocal()
    
    try:
        # 기존 데이터 확인
        existing_users = db.query(User).count()
        if existing_users > 0:
            # Docker 환경에서는 자동으로 계속 진행
            force = os.getenv("SEED_FORCE", "false").lower() == "true"
            if not force:
                try:
                    response = input(f"기존 데이터가 {existing_users}개 있습니다. 삭제하고 새로 생성하시겠습니까? (y/N): ")
                    if response.lower() != 'y':
                        print("취소되었습니다.")
                        return
                except EOFError:
                    # Docker 환경에서 input()이 불가능한 경우 자동 진행
                    print(f"기존 데이터 {existing_users}개가 있지만 계속 진행합니다...")
            
            # 기존 데이터 삭제
            print("기존 데이터 삭제 중...")
            db.query(Task).delete()
            db.query(Event).delete()
            db.query(Calendar).delete()
            db.query(User).delete()
            db.commit()
            print("기존 데이터 삭제 완료")
        
        # 데이터 생성
        users = generate_users(db, count=20)
        calendars = generate_calendars(db, users, count=40)
        events = generate_events(db, calendars, count=100)
        tasks = generate_tasks(db, calendars, count=100)
        
        # 검증
        verify_data(db)
        
        print("\n" + "=" * 50)
        print("시드 데이터 생성 완료!")
        print("=" * 50)
        
    except Exception as e:
        db.rollback()
        print(f"\n오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

