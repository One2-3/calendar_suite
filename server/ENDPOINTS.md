# API 엔드포인트 목록

총 **35개 이상**의 엔드포인트가 구현되어 있습니다.

## 인증 (Auth) - 7개

| Method | Path | 설명 | 인증 | 상태코드 |
|--------|------|------|------|----------|
| POST | `/api/v1/auth/signup` | 회원가입 | - | 201, 409, 422 |
| POST | `/api/v1/auth/login` | 로그인 | - | 200, 401, 422 |
| POST | `/api/v1/auth/refresh` | 토큰 갱신 | - | 200, 401 |
| POST | `/api/v1/auth/logout` | 로그아웃 | ✓ | 200, 401 |
| GET | `/api/v1/auth/me` | 내 정보 조회 | ✓ | 200, 401 |
| POST | `/api/v1/auth/firebase` | Firebase 로그인 | - | 200, 400, 401, 503 |
| GET | `/api/v1/auth/google` | Google OAuth 시작 | - | 302, 503, 500 |
| GET | `/api/v1/auth/google/callback` | Google OAuth 콜백 | - | 200, 400, 500, 503 |

## 사용자 (Users) - 5개

| Method | Path | 설명 | 인증 | 상태코드 |
|--------|------|------|------|----------|
| GET | `/api/v1/users/me` | 내 정보 조회 | ✓ | 200, 401, 403 |
| PUT | `/api/v1/users/me` | 내 정보 수정 | ✓ | 200, 401, 403, 409, 422 |
| GET | `/api/v1/users` | 사용자 목록 (관리자) | ✓ Admin | 200, 401, 403 |
| GET | `/api/v1/users/{user_id}` | 사용자 상세 (관리자) | ✓ Admin | 200, 401, 403, 404 |
| PUT | `/api/v1/users/{user_id}` | 사용자 수정 (관리자) | ✓ Admin | 200, 401, 403, 404, 409, 422 |

## 캘린더 (Calendars) - 5개

| Method | Path | 설명 | 인증 | 상태코드 |
|--------|------|------|------|----------|
| POST | `/api/v1/calendars` | 캘린더 생성 | ✓ | 201, 400, 401, 422 |
| GET | `/api/v1/calendars` | 캘린더 목록 | ✓ | 200, 401, 403 |
| GET | `/api/v1/calendars/{calendar_id}` | 캘린더 상세 | ✓ | 200, 401, 403, 404 |
| PUT | `/api/v1/calendars/{calendar_id}` | 캘린더 수정 | ✓ | 200, 401, 403, 404, 422 |
| DELETE | `/api/v1/calendars/{calendar_id}` | 캘린더 삭제 | ✓ | 204, 401, 403, 404 |

## 이벤트 (Events) - 5개

| Method | Path | 설명 | 인증 | 상태코드 |
|--------|------|------|------|----------|
| POST | `/api/v1/events` | 이벤트 생성 | ✓ | 201, 400, 401, 403, 404, 422 |
| GET | `/api/v1/events` | 이벤트 목록 | ✓ | 200, 401, 403 |
| GET | `/api/v1/events/{event_id}` | 이벤트 상세 | ✓ | 200, 401, 403, 404 |
| PUT | `/api/v1/events/{event_id}` | 이벤트 수정 | ✓ | 200, 400, 401, 403, 404, 422 |
| DELETE | `/api/v1/events/{event_id}` | 이벤트 삭제 | ✓ | 204, 401, 403, 404 |

## 작업 (Tasks) - 5개

| Method | Path | 설명 | 인증 | 상태코드 |
|--------|------|------|------|----------|
| POST | `/api/v1/tasks` | 작업 생성 | ✓ | 201, 400, 401, 403, 404, 422 |
| GET | `/api/v1/tasks` | 작업 목록 | ✓ | 200, 401, 403 |
| GET | `/api/v1/tasks/{task_id}` | 작업 상세 | ✓ | 200, 401, 403, 404 |
| PUT | `/api/v1/tasks/{task_id}` | 작업 수정 | ✓ | 200, 401, 403, 404, 422 |
| DELETE | `/api/v1/tasks/{task_id}` | 작업 삭제 | ✓ | 204, 401, 403, 404 |

## 관리자 (Admin) - 8개

| Method | Path | 설명 | 인증 | 상태코드 |
|--------|------|------|------|----------|
| GET | `/api/v1/admin/users` | 모든 사용자 목록 | ✓ Admin | 200, 401, 403 |
| GET | `/api/v1/admin/users/{user_id}` | 사용자 상세 | ✓ Admin | 200, 401, 403, 404 |
| PATCH | `/api/v1/admin/users/{user_id}/role` | 사용자 역할 변경 | ✓ Admin | 200, 400, 401, 403, 404, 422 |
| DELETE | `/api/v1/admin/users/{user_id}` | 사용자 삭제 | ✓ Admin | 204, 400, 401, 403, 404 |
| POST | `/api/v1/admin/users/{user_id}/ban` | 사용자 차단 | ✓ Admin | 200, 400, 401, 403, 404 |
| POST | `/api/v1/admin/users/{user_id}/unban` | 사용자 차단 해제 | ✓ Admin | 200, 401, 403, 404 |
| POST | `/api/v1/admin/users/{user_id}/deactivate` | 사용자 비활성화 | ✓ Admin | 200, 400, 401, 403, 404 |
| POST | `/api/v1/admin/users/{user_id}/activate` | 사용자 활성화 | ✓ Admin | 200, 401, 403, 404 |

## 통계 (Stats) - 3개

| Method | Path | 설명 | 인증 | 상태코드 |
|--------|------|------|------|----------|
| GET | `/api/v1/stats/daily` | 일일 통계 | ✓ Admin | 200, 401, 403 |
| GET | `/api/v1/stats/top-calendars` | 인기 캘린더 통계 | ✓ Admin | 200, 401, 403 |
| GET | `/api/v1/stats/summary` | 통계 요약 | ✓ Admin | 200, 401, 403 |

## 기타 - 1개

| Method | Path | 설명 | 인증 | 상태코드 |
|--------|------|------|------|----------|
| GET | `/health` | 헬스 체크 | - | 200 |

---

## 총 엔드포인트 수: **38개**

## HTTP 상태코드 매핑 (12종 이상)

| 상태코드 | 발생 상황 | 예시 |
|---------|----------|------|
| **200** | 성공 | 조회, 수정 성공 |
| **201** | 생성 성공 | 리소스 생성 성공 |
| **204** | 삭제 성공 | 리소스 삭제 성공 |
| **302** | 리다이렉트 | OAuth 리다이렉트 |
| **400** | 잘못된 요청 | 날짜 검증 실패, 자기 자신 삭제 시도 |
| **401** | 인증 실패 | 토큰 없음/만료, 잘못된 로그인 |
| **403** | 권한 없음 | 관리자 권한 필요, 차단된 사용자 |
| **404** | 리소스 없음 | 사용자/캘린더/이벤트/작업 없음 |
| **409** | 충돌 | 이메일 중복 |
| **422** | 검증 실패 | Pydantic 검증 오류 |
| **429** | Rate Limit 초과 | 분당/시간당 요청 제한 초과 |
| **500** | 서버 오류 | 내부 서버 오류 |
| **503** | 서비스 불가 | Firebase/Google OAuth 미설정 |

## 페이징 응답 포맷

모든 목록 조회 엔드포인트는 다음 포맷을 사용합니다:

```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "total_elements": 100,
  "total_pages": 5,
  "sort": "created_at,DESC"
}
```

## 필터링 파라미터

공통 필터링 파라미터:
- `page`: 페이지 번호 (0부터 시작)
- `size`: 페이지 크기 (1-100)
- `sort`: 정렬 (예: `created_at,DESC`)
- `keyword`: 검색 키워드
- 날짜 필터: `created_from`, `created_to`, `start_from`, `start_to`, `due_from`, `due_to` 등






