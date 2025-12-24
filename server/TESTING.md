# 테스트 가이드

## pytest 기반 자동화 테스트

### 설치

```bash
cd calendar-suite/server
pip install -r requirements.txt
```

### 테스트 실행

#### 모든 테스트 실행
```bash
pytest
```

#### 특정 테스트 파일 실행
```bash
pytest tests/test_auth.py
```

#### 특정 테스트 클래스 실행
```bash
pytest tests/test_auth.py::TestLogin
```

#### 특정 테스트 함수 실행
```bash
pytest tests/test_auth.py::TestLogin::test_login_success
```

#### 상세 출력
```bash
pytest -v
```

#### 커버리지 포함
```bash
pytest --cov=app --cov-report=html
```

### 테스트 구조

```
tests/
├── __init__.py
├── conftest.py          # 공통 픽스처
├── test_auth.py         # 인증 테스트 (8개)
├── test_users.py        # 사용자 테스트 (6개)
├── test_calendars.py    # 캘린더 테스트 (8개)
├── test_events.py       # 이벤트 테스트 (8개)
├── test_tasks.py        # 작업 테스트 (6개)
├── test_admin.py        # 관리자 테스트 (9개)
├── test_stats.py        # 통계 테스트 (5개)
└── test_rate_limit.py   # Rate Limit 테스트 (1개)
```

**총 테스트 수: 51개**

### 테스트 커버리지

#### 성공 케이스
- 회원가입, 로그인, 토큰 갱신, 로그아웃
- 사용자 정보 조회/수정
- 캘린더/이벤트/작업 CRUD
- 관리자 기능 (역할 변경, 차단, 비활성화)
- 통계 조회

#### 실패 케이스 (HTTP 상태코드)
- **401 Unauthorized**: 인증 실패, 토큰 없음
- **403 Forbidden**: 권한 없음, 차단된 사용자, 비활성화된 사용자
- **404 Not Found**: 리소스 없음
- **409 Conflict**: 이메일 중복
- **422 Unprocessable Entity**: 검증 오류
- **400 Bad Request**: 잘못된 요청 (날짜 검증 등)

### 테스트 픽스처

- `client`: FastAPI 테스트 클라이언트
- `db`: 테스트용 데이터베이스 세션
- `test_user`: 일반 사용자
- `test_admin`: 관리자 사용자
- `test_banned_user`: 차단된 사용자
- `test_inactive_user`: 비활성화된 사용자
- `auth_headers`: 일반 사용자 인증 헤더
- `admin_headers`: 관리자 인증 헤더

## Postman 컬렉션

### 파일 위치
- 컬렉션: `postman/Calendar_Suite_API.postman_collection.json`
- 환경 변수: `postman/Calendar_Suite_API.postman_environment.json`

### 환경 변수

1. **BASE_URL**: API 기본 URL (기본값: `http://localhost:8080`)
2. **ACCESS_TOKEN**: 액세스 토큰 (자동 저장)
3. **REFRESH_TOKEN**: 리프레시 토큰 (자동 저장)
4. **CALENDAR_ID**: 캘린더 ID (자동 저장)
5. **EVENT_ID**: 이벤트 ID (자동 저장)

### Pre-request 스크립트

컬렉션 레벨에서 자동으로 토큰을 헤더에 주입합니다:

```javascript
if (pm.environment.get('ACCESS_TOKEN')) {
    pm.request.headers.add({
        key: 'Authorization',
        value: 'Bearer ' + pm.environment.get('ACCESS_TOKEN')
    });
}
```

### Test 스크립트

#### 1. Signup - 토큰 저장
```javascript
pm.test("Save tokens", function () {
    var jsonData = pm.response.json();
    if (jsonData.access_token) {
        pm.environment.set('ACCESS_TOKEN', jsonData.access_token);
    }
    if (jsonData.refresh_token) {
        pm.environment.set('REFRESH_TOKEN', jsonData.refresh_token);
    }
});
```

#### 2. Login - 토큰 저장 및 응답 코드 검증
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Save tokens", function () {
    var jsonData = pm.response.json();
    if (jsonData.access_token) {
        pm.environment.set('ACCESS_TOKEN', jsonData.access_token);
    }
    if (jsonData.refresh_token) {
        pm.environment.set('REFRESH_TOKEN', jsonData.refresh_token);
    }
});
```

#### 3. Refresh Token - 토큰 업데이트
```javascript
pm.test("Update tokens", function () {
    var jsonData = pm.response.json();
    if (jsonData.access_token) {
        pm.environment.set('ACCESS_TOKEN', jsonData.access_token);
    }
    if (jsonData.refresh_token) {
        pm.environment.set('REFRESH_TOKEN', jsonData.refresh_token);
    }
});
```

#### 4. Create Calendar - ID 저장
```javascript
pm.test("Save calendar ID", function () {
    var jsonData = pm.response.json();
    if (jsonData.id) {
        pm.environment.set('CALENDAR_ID', jsonData.id);
    }
});
```

#### 5. Get All Users - 응답 형식 검증
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is array", function () {
    pm.expect(pm.response.json()).to.be.an('array');
});
```

### Postman 사용 방법

1. **컬렉션 가져오기**
   - Postman 열기
   - Import → `Calendar_Suite_API.postman_collection.json` 선택

2. **환경 변수 설정**
   - Import → `Calendar_Suite_API.postman_environment.json` 선택
   - 환경 선택: "Calendar Suite API - Local"

3. **테스트 실행**
   - Signup 또는 Login 요청 실행
   - 토큰이 자동으로 환경 변수에 저장됨
   - 이후 요청들은 자동으로 토큰이 주입됨

### 요청 순서 권장

1. Signup 또는 Login (토큰 획득)
2. Get Me (인증 확인)
3. Create Calendar
4. Get Calendars
5. Create Event
6. Get Events
7. (관리자) Get All Users
8. (관리자) Update User Role
9. (관리자) Get Daily Stats

## CI/CD 통합

### GitHub Actions 예시

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd calendar-suite/server
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd calendar-suite/server
          pytest -v
```

## 문제 해결

### 테스트 실패 시

1. **데이터베이스 연결 오류**
   - 테스트는 인메모리 SQLite를 사용하므로 별도 설정 불필요

2. **Redis 연결 오류**
   - 테스트는 Mock Redis를 사용하므로 별도 설정 불필요

3. **토큰 만료**
   - 각 테스트는 독립적으로 실행되며, 필요한 경우 새로 로그인

4. **의존성 오류**
   - `pip install -r requirements.txt` 재실행






