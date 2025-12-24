"""
Firebase 설정 확인 및 검증 스크립트

이 스크립트는 Firebase Admin SDK 설정이 올바른지 확인합니다.
서비스 계정 키는 Firebase Console에서 수동으로 생성해야 합니다.
"""
import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.firebase import init_firebase, verify_firebase_token


def check_firebase_config():
    """Firebase 설정 확인"""
    print("=" * 60)
    print("Firebase 설정 확인")
    print("=" * 60)
    
    # 환경변수 확인
    print("\n1. 환경변수 확인:")
    has_json = bool(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
    has_path = bool(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
    
    if has_json:
        print("   ✓ FIREBASE_SERVICE_ACCOUNT_JSON: 설정됨")
    else:
        print("   ✗ FIREBASE_SERVICE_ACCOUNT_JSON: 설정되지 않음")
    
    if has_path:
        print(f"   ✓ FIREBASE_SERVICE_ACCOUNT_PATH: {settings.FIREBASE_SERVICE_ACCOUNT_PATH}")
    else:
        print("   ✗ FIREBASE_SERVICE_ACCOUNT_PATH: 설정되지 않음")
    
    # 파일 존재 확인
    if has_path:
        path = Path(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
        if path.exists():
            print(f"   ✓ 파일 존재: {path.absolute()}")
        else:
            print(f"   ✗ 파일 없음: {path.absolute()}")
    
    # 기본 위치 확인
    default_path = Path("firebase-service-account.json")
    if default_path.exists():
        print(f"   ✓ 기본 위치 파일 존재: {default_path.absolute()}")
    
    # Firebase 초기화 시도
    print("\n2. Firebase Admin SDK 초기화:")
    try:
        app = init_firebase()
        if app:
            print("   ✓ Firebase Admin SDK 초기화 성공")
            print(f"   ✓ 프로젝트 ID: {app.project_id}")
        else:
            print("   ✗ Firebase Admin SDK 초기화 실패 (설정되지 않음)")
            print("\n   설정 방법:")
            print("   1. Firebase Console (https://console.firebase.google.com/) 접속")
            print("   2. 프로젝트 선택 → 프로젝트 설정 → 서비스 계정")
            print("   3. '새 비공개 키 생성' 클릭하여 JSON 파일 다운로드")
            print("   4. 파일을 서버 디렉토리에 저장")
            print("   5. .env 파일에 다음 중 하나 설정:")
            print("      FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json")
            print("      또는")
            print("      FIREBASE_SERVICE_ACCOUNT_JSON='{...}'")
            return False
    except Exception as e:
        print(f"   ✗ Firebase Admin SDK 초기화 실패: {e}")
        return False
    
    print("\n3. 설정 완료!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = check_firebase_config()
    sys.exit(0 if success else 1)






