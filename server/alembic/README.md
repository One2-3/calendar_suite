# Alembic 마이그레이션 가이드

## 초기 설정

### 1. Alembic 초기화 (이미 완료됨)

Alembic은 이미 초기화되어 있습니다. 만약 처음부터 시작하려면:

```bash
alembic init alembic
```

### 2. 첫 마이그레이션 생성

모델 변경사항을 기반으로 마이그레이션 파일 생성:

```bash
# 로컬 환경에서
cd server
alembic revision --autogenerate -m "Initial migration"

# 또는 Docker 컨테이너 내에서
docker compose exec server alembic revision --autogenerate -m "Initial migration"
```

### 3. 마이그레이션 실행

생성된 마이그레이션을 데이터베이스에 적용:

```bash
# 로컬 환경에서
alembic upgrade head

# 또는 Docker 컨테이너 내에서
docker compose exec server alembic upgrade head
```

## 일반적인 작업

### 새 마이그레이션 생성

모델을 변경한 후:

```bash
alembic revision --autogenerate -m "설명 메시지"
```

### 마이그레이션 적용

```bash
alembic upgrade head
```

### 마이그레이션 롤백

```bash
# 한 단계 롤백
alembic downgrade -1

# 특정 리비전으로 롤백
alembic downgrade <revision_id>
```

### 마이그레이션 히스토리 확인

```bash
alembic history
```

### 현재 마이그레이션 상태 확인

```bash
alembic current
```

## 주의사항

1. **마이그레이션 파일 검토**: `--autogenerate`로 생성된 마이그레이션은 항상 검토하고 필요시 수정하세요.
2. **프로덕션 환경**: 프로덕션 환경에서는 마이그레이션을 신중하게 테스트한 후 적용하세요.
3. **데이터 백업**: 중요한 데이터가 있는 경우 마이그레이션 전에 백업하세요.






