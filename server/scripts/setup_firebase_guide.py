"""
Firebase 설정 가이드 출력 스크립트

Firebase 서비스 계정 키 생성 가이드를 출력합니다.
"""
import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


def print_firebase_guide():
    """Firebase 설정 가이드 출력"""
    print("=" * 70)
    print("Firebase Admin SDK 설정 가이드")
    print("=" * 70)
    print()
    print("⚠️  중요: 서비스 계정 키는 Firebase Console에서만 생성할 수 있습니다.")
    print("   파이썬 스크립트로는 자동 생성이 불가능합니다.")
    print()
    print("=" * 70)
    print("1단계: Firebase Console에서 서비스 계정 키 생성")
    print("=" * 70)
    print()
    print("1. Firebase Console 접속:")
    print("   https://console.firebase.google.com/")
    print()
    print("2. 프로젝트 선택 또는 생성")
    print()
    print("3. 프로젝트 설정 열기:")
    print("   - 좌측 메뉴에서 ⚙️ 아이콘 클릭")
    print("   - '프로젝트 설정' 선택")
    print()
    print("4. 서비스 계정 탭으로 이동")
    print()
    print("5. '새 비공개 키 생성' 버튼 클릭")
    print("   - 경고 메시지 확인 후 '키 생성' 클릭")
    print("   - JSON 파일이 자동으로 다운로드됩니다")
    print()
    print("=" * 70)
    print("2단계: 서버에 파일 배치")
    print("=" * 70)
    print()
    print("다운로드한 JSON 파일을 다음 위치에 저장:")
    print(f"   {Path(__file__).parent.parent.absolute() / 'firebase-service-account.json'}")
    print()
    print("또는 원하는 위치에 저장 후 .env 파일에 경로 설정:")
    print("   FIREBASE_SERVICE_ACCOUNT_PATH=./your-path/firebase-service-account.json")
    print()
    print("=" * 70)
    print("3단계: 환경변수 설정")
    print("=" * 70)
    print()
    print(".env 파일에 다음 중 하나를 추가:")
    print()
    print("방법 1: 파일 경로 사용 (권장)")
    print("   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json")
    print()
    print("방법 2: JSON 문자열 사용")
    print("   FIREBASE_SERVICE_ACCOUNT_JSON='{\"type\":\"service_account\",...}'")
    print()
    print("=" * 70)
    print("4단계: 설정 확인")
    print("=" * 70)
    print()
    print("다음 명령어로 설정이 올바른지 확인:")
    print("   python scripts/check_firebase.py")
    print()
    print("=" * 70)
    print("보안 주의사항")
    print("=" * 70)
    print()
    print("⚠️  절대 Git에 커밋하지 마세요:")
    print("   - firebase-service-account.json 파일")
    print("   - .env 파일")
    print("   - FIREBASE_SERVICE_ACCOUNT_JSON 환경변수")
    print()
    print(".gitignore에 이미 포함되어 있지만 다시 확인하세요.")
    print()
    print("=" * 70)
    
    # 현재 설정 상태 확인
    print("\n현재 설정 상태:")
    print("-" * 70)
    if settings.FIREBASE_SERVICE_ACCOUNT_PATH:
        path = Path(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
        exists = "✓ 존재" if path.exists() else "✗ 없음"
        print(f"FIREBASE_SERVICE_ACCOUNT_PATH: {settings.FIREBASE_SERVICE_ACCOUNT_PATH} ({exists})")
    else:
        print("FIREBASE_SERVICE_ACCOUNT_PATH: 설정되지 않음")
    
    if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        print("FIREBASE_SERVICE_ACCOUNT_JSON: 설정됨 (길이: {})".format(
            len(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
        ))
    else:
        print("FIREBASE_SERVICE_ACCOUNT_JSON: 설정되지 않음")
    
    default_path = Path("firebase-service-account.json")
    if default_path.exists():
        print(f"기본 위치 파일: {default_path.absolute()} (✓ 존재)")
    else:
        print(f"기본 위치 파일: 없음")
    print()


if __name__ == "__main__":
    print_firebase_guide()






