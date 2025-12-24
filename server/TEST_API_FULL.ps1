# Calendar Suite API Full Test Script
# Run in PowerShell: .\TEST_API_FULL.ps1

$baseUrl = "http://localhost:8080/api/v1"
$global:ACCESS_TOKEN = $null
$global:REFRESH_TOKEN = $null
$global:USER_ID = $null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Calendar Suite API Test Started" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ========================================
# 1. Signup
# ========================================
Write-Host "1. Signup (POST /auth/signup)" -ForegroundColor Green
Write-Host "Input:" -ForegroundColor Yellow
$signupBody = @{
    email = "testuser@example.com"
    password = "password123"
    display_name = "Test User"
} | ConvertTo-Json
Write-Host $signupBody -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method Post -Body $signupBody -ContentType "application/json"
    $global:ACCESS_TOKEN = $response.access_token
    $global:REFRESH_TOKEN = $response.refresh_token
    Write-Host "Response (201 Created):" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    Write-Host "Success" -ForegroundColor Green
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
Write-Host ""

# ========================================
# 2. Login
# ========================================
Write-Host "2. Login (POST /auth/login)" -ForegroundColor Green
Write-Host "Input:" -ForegroundColor Yellow
$loginBody = @{
    email = "testuser@example.com"
    password = "password123"
} | ConvertTo-Json
Write-Host $loginBody -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $global:ACCESS_TOKEN = $response.access_token
    $global:REFRESH_TOKEN = $response.refresh_token
    Write-Host "Response (200 OK):" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    Write-Host "Success" -ForegroundColor Green
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
Write-Host ""

# ========================================
# 3. Get Me
# ========================================
Write-Host "3. Get Me (GET /auth/me)" -ForegroundColor Green
Write-Host "Header: Authorization: Bearer $($global:ACCESS_TOKEN.Substring(0, 30))..." -ForegroundColor Gray

try {
    $headers = @{
        Authorization = "Bearer $global:ACCESS_TOKEN"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
    $global:USER_ID = $response.user.id
    Write-Host "Response (200 OK):" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    Write-Host "Success" -ForegroundColor Green
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
Write-Host ""

# ========================================
# 4. Refresh Token
# ========================================
Write-Host "4. Refresh Token (POST /auth/refresh)" -ForegroundColor Green
Write-Host "Input:" -ForegroundColor Yellow
$refreshBody = @{
    refresh_token = $global:REFRESH_TOKEN
} | ConvertTo-Json
Write-Host ($refreshBody -replace $global:REFRESH_TOKEN, "REFRESH_TOKEN...") -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method Post -Body $refreshBody -ContentType "application/json"
    $global:ACCESS_TOKEN = $response.access_token
    $global:REFRESH_TOKEN = $response.refresh_token
    Write-Host "Response (200 OK):" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    Write-Host "Success" -ForegroundColor Green
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
Write-Host ""

# ========================================
# 5. Create Admin Account (for admin tests)
# ========================================
Write-Host "5. Create Admin Account (POST /auth/signup)" -ForegroundColor Green
Write-Host "Input:" -ForegroundColor Yellow
$adminSignupBody = @{
    email = "admin@example.com"
    password = "admin12345"
    display_name = "Admin User"
} | ConvertTo-Json
Write-Host $adminSignupBody -ForegroundColor Gray

try {
    $adminResponse = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method Post -Body $adminSignupBody -ContentType "application/json"
    $adminAccessToken = $adminResponse.access_token
    Write-Host "Response (201 Created):" -ForegroundColor Yellow
    Write-Host ($adminResponse | ConvertTo-Json -Depth 3) -ForegroundColor White
    
    Write-Host "Note: Admin role must be changed in DB or use existing admin account." -ForegroundColor Yellow
    Write-Host "Admin account created" -ForegroundColor Green
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
Write-Host ""

# ========================================
# 6. Admin - Get All Users
# ========================================
Write-Host "6. Admin - Get All Users (GET /admin/users)" -ForegroundColor Green
Write-Host "Note: Admin token required. Use admin token from above or" -ForegroundColor Yellow
Write-Host "      change user role to ADMIN in DB and login with that user." -ForegroundColor Yellow
Write-Host ""

if ($adminAccessToken) {
    Write-Host "Trying with admin token..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $adminAccessToken"
        }
        $response = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method Get -Headers $headers
        Write-Host "Response (200 OK):" -ForegroundColor Yellow
        Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
        Write-Host "Success" -ForegroundColor Green
    } catch {
        Write-Host "Error (Expected 403 Forbidden - No admin permission):" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message -ForegroundColor Red
        }
    }
} else {
    Write-Host "Skipping: No admin token available" -ForegroundColor Yellow
}
Write-Host ""

# ========================================
# 7. Admin - Update User Role
# ========================================
Write-Host "7. Admin - Update User Role (PATCH /admin/users/{user_id}/role)" -ForegroundColor Green
Write-Host "Note: Admin permission required." -ForegroundColor Yellow
Write-Host ""

if ($adminAccessToken -and $global:USER_ID) {
    Write-Host "Input:" -ForegroundColor Yellow
    $roleBody = @{
        new_role = "ADMIN"
    } | ConvertTo-Json
    Write-Host "User ID: $global:USER_ID" -ForegroundColor Gray
    Write-Host $roleBody -ForegroundColor Gray
    
    try {
        $headers = @{
            Authorization = "Bearer $adminAccessToken"
        }
        $response = Invoke-RestMethod -Uri "$baseUrl/admin/users/$global:USER_ID/role" -Method Patch -Body $roleBody -ContentType "application/json" -Headers $headers
        Write-Host "Response (200 OK):" -ForegroundColor Yellow
        Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
        Write-Host "Success" -ForegroundColor Green
    } catch {
        Write-Host "Error:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message -ForegroundColor Red
        }
    }
} else {
    Write-Host "Skipping: No admin token or user ID available" -ForegroundColor Yellow
}
Write-Host ""

# ========================================
# 8. Admin - Delete User
# ========================================
Write-Host "8. Admin - Delete User (DELETE /admin/users/{user_id})" -ForegroundColor Green
Write-Host "Note: Admin permission required. Creating test user to delete." -ForegroundColor Yellow
Write-Host ""

$testUserBody = @{
    email = "deleteme@example.com"
    password = "password123"
    display_name = "Delete Me"
} | ConvertTo-Json

try {
    $testUserResponse = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method Post -Body $testUserBody -ContentType "application/json"
    $testUserId = $testUserResponse.user.id
    
    if ($adminAccessToken -and $testUserId) {
        Write-Host "User ID to delete: $testUserId" -ForegroundColor Gray
        try {
            $headers = @{
                Authorization = "Bearer $adminAccessToken"
            }
            Invoke-RestMethod -Uri "$baseUrl/admin/users/$testUserId" -Method Delete -Headers $headers
            Write-Host "Response (204 No Content):" -ForegroundColor Yellow
            Write-Host "User deleted successfully" -ForegroundColor White
            Write-Host "Success" -ForegroundColor Green
        } catch {
            Write-Host "Error:" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
            if ($_.ErrorDetails.Message) {
                Write-Host $_.ErrorDetails.Message -ForegroundColor Red
            }
        }
    } else {
        Write-Host "Skipping: No admin token available" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Failed to create test user:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

# ========================================
# 9. Logout
# ========================================
Write-Host "9. Logout (POST /auth/logout)" -ForegroundColor Green
Write-Host "Header: Authorization: Bearer $($global:ACCESS_TOKEN.Substring(0, 30))..." -ForegroundColor Gray

try {
    $headers = @{
        Authorization = "Bearer $global:ACCESS_TOKEN"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method Post -Headers $headers
    Write-Host "Response (200 OK):" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    Write-Host "Success" -ForegroundColor Green
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
Write-Host ""

# ========================================
# 10. Error Case Tests
# ========================================
Write-Host "10. Error Case Tests" -ForegroundColor Green
Write-Host ""

# 10-1. Duplicate Email Signup (409 Conflict)
Write-Host "10-1. Duplicate Email Signup (Expected: 409 Conflict)" -ForegroundColor Yellow
$duplicateBody = @{
    email = "testuser@example.com"
    password = "password123"
    display_name = "Duplicate User"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method Post -Body $duplicateBody -ContentType "application/json"
} catch {
    Write-Host "Expected Error (409 Conflict):" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host ($errorJson | ConvertTo-Json -Depth 3) -ForegroundColor White
    }
    Write-Host "Success (409 error is expected)" -ForegroundColor Green
}
Write-Host ""

# 10-2. Wrong Password Login (401 Unauthorized)
Write-Host "10-2. Wrong Password Login (Expected: 401 Unauthorized)" -ForegroundColor Yellow
$wrongPasswordBody = @{
    email = "testuser@example.com"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $wrongPasswordBody -ContentType "application/json"
} catch {
    Write-Host "Expected Error (401 Unauthorized):" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host ($errorJson | ConvertTo-Json -Depth 3) -ForegroundColor White
    }
    Write-Host "Success (401 error is expected)" -ForegroundColor Green
}
Write-Host ""

# 10-3. Get Me Without Token (401 Unauthorized)
Write-Host "10-3. Get Me Without Token (Expected: 401 Unauthorized)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get
} catch {
    Write-Host "Expected Error (401 Unauthorized):" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host ($errorJson | ConvertTo-Json -Depth 3) -ForegroundColor White
    }
    Write-Host "Success (401 error is expected)" -ForegroundColor Green
}
Write-Host ""

# 10-4. Regular User Accessing Admin Endpoint (403 Forbidden)
Write-Host "10-4. Regular User Accessing Admin Endpoint (Expected: 403 Forbidden)" -ForegroundColor Yellow
if ($global:ACCESS_TOKEN) {
    try {
        $headers = @{
            Authorization = "Bearer $global:ACCESS_TOKEN"
        }
        Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method Get -Headers $headers
    } catch {
        Write-Host "Expected Error (403 Forbidden):" -ForegroundColor Yellow
        if ($_.ErrorDetails.Message) {
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host ($errorJson | ConvertTo-Json -Depth 3) -ForegroundColor White
        }
        Write-Host "Success (403 error is expected)" -ForegroundColor Green
    }
} else {
    Write-Host "Skipping: No token available" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
