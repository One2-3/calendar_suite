# API 테스트 가이드

## PowerShell에서 테스트하기

PowerShell에서는 `Invoke-RestMethod` 또는 `curl.exe`를 사용할 수 있습니다.

### 방법 1: Invoke-RestMethod 사용 (권장)

#### 1. 회원가입
```powershell
$body = @{
    email = "user@example.com"
    password = "password123"
    display_name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/signup" -Method Post -Body $body -ContentType "application/json"
```

#### 2. 로그인
```powershell
$body = @{
    email = "user@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
$accessToken = $response.access_token
$refreshToken = $response.refresh_token

# 토큰 저장
$global:ACCESS_TOKEN = $accessToken
$global:REFRESH_TOKEN = $refreshToken
```

#### 3. 내 정보 조회
```powershell
$headers = @{
    Authorization = "Bearer $global:ACCESS_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/me" -Method Get -Headers $headers
```

#### 4. 토큰 갱신
```powershell
$body = @{
    refresh_token = $global:REFRESH_TOKEN
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/refresh" -Method Post -Body $body -ContentType "application/json"
$global:ACCESS_TOKEN = $response.access_token
$global:REFRESH_TOKEN = $response.refresh_token
```

#### 5. 로그아웃
```powershell
$headers = @{
    Authorization = "Bearer $global:ACCESS_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/logout" -Method Post -Headers $headers
```

#### 6. 관리자 - 모든 사용자 목록 조회
```powershell
$headers = @{
    Authorization = "Bearer $global:ACCESS_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/users" -Method Get -Headers $headers
```

#### 7. 관리자 - 사용자 역할 변경
```powershell
$body = @{
    new_role = "ADMIN"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $global:ACCESS_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/users/USER_ID/role" -Method Patch -Body $body -ContentType "application/json" -Headers $headers
```

#### 8. 관리자 - 사용자 삭제
```powershell
$headers = @{
    Authorization = "Bearer $global:ACCESS_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/users/USER_ID" -Method Delete -Headers $headers
```

### 방법 2: curl.exe 사용 (Windows 10+)

Windows 10 이상에서는 실제 `curl.exe`가 포함되어 있습니다.

#### 1. 회원가입
```powershell
curl.exe -X POST "http://localhost:8080/api/v1/auth/signup" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"user@example.com\",\"password\":\"password123\",\"display_name\":\"Test User\"}'
```

#### 2. 로그인
```powershell
$response = curl.exe -X POST "http://localhost:8080/api/v1/auth/login" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"user@example.com\",\"password\":\"password123\"}' | ConvertFrom-Json

$global:ACCESS_TOKEN = $response.access_token
$global:REFRESH_TOKEN = $response.refresh_token
```

#### 3. 내 정보 조회
```powershell
curl.exe -X GET "http://localhost:8080/api/v1/auth/me" `
  -H "Authorization: Bearer $global:ACCESS_TOKEN"
```

## Linux/Mac에서 테스트하기

### 1. 회원가입
```bash
curl -X POST "http://localhost:8080/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "display_name": "Test User"
  }'
```

### 2. 로그인
```bash
RESPONSE=$(curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }')

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refresh_token')
```

### 3. 내 정보 조회
```bash
curl -X GET "http://localhost:8080/api/v1/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 전체 테스트 시나리오 (PowerShell)

```powershell
# 1. 회원가입
Write-Host "1. 회원가입..." -ForegroundColor Green
$signupBody = @{
    email = "test@example.com"
    password = "password123"
    display_name = "Test User"
} | ConvertTo-Json

$signupResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/signup" -Method Post -Body $signupBody -ContentType "application/json"
$global:ACCESS_TOKEN = $signupResponse.access_token
$global:REFRESH_TOKEN = $signupResponse.refresh_token
Write-Host "Access Token: $($global:ACCESS_TOKEN.Substring(0, 20))..." -ForegroundColor Cyan

# 2. 내 정보 조회
Write-Host "`n2. 내 정보 조회..." -ForegroundColor Green
$headers = @{ Authorization = "Bearer $global:ACCESS_TOKEN" }
$meResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/me" -Method Get -Headers $headers
Write-Host "User: $($meResponse.user.email) ($($meResponse.user.role))" -ForegroundColor Cyan

# 3. 토큰 갱신
Write-Host "`n3. 토큰 갱신..." -ForegroundColor Green
$refreshBody = @{ refresh_token = $global:REFRESH_TOKEN } | ConvertTo-Json
$refreshResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/refresh" -Method Post -Body $refreshBody -ContentType "application/json"
$global:ACCESS_TOKEN = $refreshResponse.access_token
$global:REFRESH_TOKEN = $refreshResponse.refresh_token
Write-Host "New Access Token: $($global:ACCESS_TOKEN.Substring(0, 20))..." -ForegroundColor Cyan

# 4. 로그아웃
Write-Host "`n4. 로그아웃..." -ForegroundColor Green
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/logout" -Method Post -Headers $headers
Write-Host "Logged out successfully" -ForegroundColor Cyan
```






