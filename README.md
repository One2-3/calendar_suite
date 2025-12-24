# Calendar Suite Project

## 📌 프로젝트 개요
Calendar Suite는 Web / Mobile 환경에서 동일한 일정 데이터를 관리할 수 있는 서비스입니다.  
Firebase Authentication을 통한 소셜 로그인과 공통 Firebase 프로젝트를 사용하며,
Backend API 서버는 JCloud 환경에 Docker 기반으로 배포됩니다.

## 🧱 전체 아키텍처
- Web App: React (apps/web)
- Mobile App: React Native (Expo 기반, apps/mobile)
- Backend API: 🔧 (FastAPI)
- Auth: Firebase Authentication + JWT
- DB: MySQL
- Cache / Session / Rate Limit: Redis
- Deployment: JCloud + Docker / Docker Compose

## 📁 Repository 구조

repo-root/
├─ apps/
│ ├─ web/ # React Web App
│ └─ mobile/ # React Native (Expo)
├─ backend/ # API Server (Dockerized)
├─ docs/
│ ├─ architecture.md
│ ├─ api-design.md
│ └─ db-schema.md
├─ postman/
│ └─ calendar-suite.postman_collection.json
├─ Dockerfile
├─ docker-compose.yml
├─ .env.example
└─ README.md

bash
코드 복사

## ▶️ 실행 방법

### 1. 환경 변수 설정
```bash
cp .env.example .env
2. Docker 실행
bash
코드 복사
docker compose up -d
3. 서비스 확인
API Base URL: http://<JCloud-IP>:<PORT>

Swagger: http://<JCloud-IP>:<PORT>/docs

Health Check: GET /health

🔐 인증 구조
Firebase Auth (Google 로그인)

Backend에서 Firebase ID Token 검증 후 JWT 발급

JWT 기반 RBAC

ROLE_USER

ROLE_ADMIN

👥 예제 계정
Role	Email	Password
USER	user1@example.com	🔧
ADMIN	admin@example.com	🔧

📊 주요 기능
사용자 인증 / 권한 관리

일정 CRUD

검색 / 페이지네이션 / 정렬

관리자 전용 통계 API

Redis 기반 Rate Limit

공통 에러 응답 포맷

📄 문서
Swagger/OpenAPI 자동 문서

Postman Collection 제공