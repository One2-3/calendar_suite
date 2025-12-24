# API 테스트 가이드 - 수동 실행

## 준비사항

1. 서버가 실행 중인지 확인:
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health"
```

2. 관리자 계정 준비 (선택사항):
   - DB에서 직접 사용자 역할을 ADMIN으로 변경하거나
   - 기존 관리자 계정 사용

## 테스트 시나리오

### 1. 회원가입 (POST /auth/signup)

**입력:**
```powershell
$body = @{
    email = "user@example.com"
    password = "password123"
    display_name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/signup" -Method Post -Body $body -ContentType "application/json"
```

**예상 응답 (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**오류 응답 (409 Conflict - 이메일 중복):**
```json
{
  "detail": "Email already registered"
}
```

---

### 2. 로그인 (POST /auth/login)

**입력:**
```powershell
$body = @{
    email = "user@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
$global:ACCESS_TOKEN = $response.access_token
$global:REFRESH_TOKEN = $response.refresh_token
```

**예상 응답 (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**오류 응답 (401 Unauthorized - 잘못된 이메일/비밀번호):**
```json
{
  "detail": "Invalid email or password"
}
```

---

### 3. 내 정보 조회 (GET /auth/me)

**입력:**
```powershell
$headers = @{
    Authorization = "Bearer $global:ACCESS_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/me" -Method Get -Headers $headers
```

**예상 응답 (200 OK):**
```json
{
  "user": {
    "id": "xxx-xxx-xxx",
    "email": "user@example.com",
    "display_name": "Test User",
    "role": "USER"
  }
}
```

**오류 응답 (401 Unauthorized - 토큰 없음/만료):**
```json
{
  "detail": "Invalid token"
}
```

---

### 4. 토큰 갱신 (POST /auth/refresh)

**입력:**
```powershell
$body = @{
    refresh_token = $global:REFRESH_TOKEN
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/refresh" -Method Post -Body $body -ContentType "application/json"
$global:ACCESS_TOKEN = $response.access_token
$global:REFRESH_TOKEN = $response.refresh_token
```

**예상 응답 (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**오류 응답 (401 Unauthorized - 잘못된/만료된 refresh token):**
```json
{
  "detail": "Invalid or expired refresh token"
}
```

---

### 5. 로그아웃 (POST /auth/logout)

**입력:**
```powershell
$headers = @{
    Authorization = "Bearer $global:ACCESS_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/logout" -Method Post -Headers $headers
```

**예상 응답 (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 6. 관리자 - 모든 사용자 목록 조회 (GET /admin/users)

**입력:**
```powershell
$headers = @{
    Authorization = "Bearer ADMIN_ACCESS_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/users" -Method Get -Headers $headers
```

**예상 응답 (200 OK):**
```json
[
  {
    "id": "xxx-xxx-xxx",
    "email": "user1@example.com",
    "display_name": "User 1",
    "role": "USER"
  },
  {
    "id": "yyy-yyy-yyy",
    "email": "admin@example.com",
    "display_name": "Admin",
    "role": "ADMIN"
  }
]
```

**오류 응답 (403 Forbidden - 관리자 권한 없음):**
```json
{
  "detail": "Requires ADMIN role"
}
```

---

### 7. 관리자 - 특정 사용자 조회 (GET /admin/users/{user_id})

**입력:**
```powershell
$headers = @{
    Authorization = "Bearer ADMIN_ACCESS_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/users/USER_ID" -Method Get -Headers $headers
```

**예상 응답 (200 OK):**
```json
{
  "id": "xxx-xxx-xxx",
  "email": "user@example.com",
  "display_name": "Test User",
  "role": "USER"
}
```

**오류 응답 (404 Not Found - 사용자 없음):**
```json
{
  "detail": "User not found"
}
```

---

### 8. 관리자 - 사용자 역할 변경 (PATCH /admin/users/{user_id}/role)

**입력:**
```powershell
$body = @{
    new_role = "ADMIN"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer ADMIN_ACCESS_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/users/USER_ID/role" -Method Patch -Body $body -ContentType "application/json" -Headers $headers
```

**예상 응답 (200 OK):**
```json
{
  "id": "xxx-xxx-xxx",
  "email": "user@example.com",
  "display_name": "Test User",
  "role": "ADMIN"
}
```

**오류 응답 (404 Not Found):**
```json
{
  "detail": "User not found"
}
```

**오류 응답 (403 Forbidden):**
```json
{
  "detail": "Requires ADMIN role"
}
```

---

### 9. 관리자 - 사용자 삭제 (DELETE /admin/users/{user_id})

**입력:**
```powershell
$headers = @{
    Authorization = "Bearer ADMIN_ACCESS_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/users/USER_ID" -Method Delete -Headers $headers
```

**예상 응답 (204 No Content):**
(응답 본문 없음)

**오류 응답 (400 Bad Request - 자기 자신 삭제 시도):**
```json
{
  "detail": "Cannot delete yourself"
}
```

---

## 에러 케이스 테스트

### 10-1. 중복 이메일 회원가입 (409 Conflict)

**입력:**
```powershell
$body = @{
    email = "user@example.com"  # 이미 존재하는 이메일
    password = "password123"
    display_name = "Duplicate"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/signup" -Method Post -Body $body -ContentType "application/json"
} catch {
    $_.ErrorDetails.Message
}
```

**예상 응답 (409 Conflict):**
```json
{
  "detail": "Email already registered"
}
```

---

### 10-2. 잘못된 비밀번호 로그인 (401 Unauthorized)

**입력:**
```powershell
$body = @{
    email = "user@example.com"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
} catch {
    $_.ErrorDetails.Message
}
```

**예상 응답 (401 Unauthorized):**
```json
{
  "detail": "Invalid email or password"
}
```

---

### 10-3. 토큰 없이 인증 필요 엔드포인트 접근 (401 Unauthorized)

**입력:**
```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/me" -Method Get
} catch {
    $_.ErrorDetails.Message
}
```

**예상 응답 (401 Unauthorized):**
```json
{
  "detail": "Not authenticated"
}
```

---

### 10-4. 일반 사용자가 관리자 엔드포인트 접근 (403 Forbidden)

**입력:**
```powershell
$headers = @{
    Authorization = "Bearer USER_ACCESS_TOKEN"  # 일반 사용자 토큰
}

try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/users" -Method Get -Headers $headers
} catch {
    $_.ErrorDetails.Message
}
```

**예상 응답 (403 Forbidden):**
```json
{
  "detail": "Requires ADMIN role"
}
```

---

### 10-5. Validation 오류 (422 Unprocessable Entity)

**입력:**
```powershell
$body = @{
    email = "invalid-email"  # 잘못된 이메일 형식
    password = "123"  # 8자 미만
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/signup" -Method Post -Body $body -ContentType "application/json"
} catch {
    $_.ErrorDetails.Message
}
```

**예상 응답 (422 Unprocessable Entity):**
```json
{
  "timestamp": "2024-12-21T18:00:00Z",
  "path": "/api/v1/auth/signup",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    },
    {
      "loc": ["body", "password"],
      "msg": "ensure this value has at least 8 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

---

## 전체 테스트 스크립트 실행

자동화된 테스트 스크립트를 실행하려면:

```powershell
cd calendar-suite/server
.\TEST_API_FULL.ps1
```

이 스크립트는 위의 모든 테스트를 자동으로 실행하고 결과를 출력합니다.






