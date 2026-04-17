# 모청 백엔드 MVP 스펙

본 문서는 모청 서비스의 백엔드 MVP 구현 기준을 정의한다.  
목표는 **인증 → 저장 → 발행 → 접근제어 → 결제 확장 준비**까지 끊김 없이 연결하는 것이다.

> 본 문서는 **목표 모델/목표 API 스펙**을 기준으로 작성되어 있다.
> 현재 실제 구현 상태와 운영 정책은 상위 문서 `docs/PRODUCT_STANDARD.md`를 따른다.

## 1) MVP 목표

- 간편로그인 사용자 인증
- 청첩장 데이터 영속 저장
- 발행 URL 생성 및 만료 관리(기본 3~6개월)
- 미디어 파일 영속 스토리지 연동(S3/R2)
- 결제 기능을 붙일 수 있는 상태 모델 선구축

## 2) 핵심 도메인 모델

## 2.1 User

- `id` (PK, UUID)
- `provider` (kakao/google/apple 등)
- `providerUserId`
- `email` (nullable)
- `name`
- `avatarUrl` (nullable)
- `createdAt`, `updatedAt`

## 2.2 Invitation

- `id` (PK, UUID)
- `userId` (FK -> User)
- `title`
- `status` (`draft` | `published` | `expired` | `archived`)
- `activeVersionId` (FK -> InvitationVersion, nullable)
- `publishedAt` (nullable)
- `expiresAt` (nullable)
- `createdAt`, `updatedAt`

## 2.3 InvitationVersion

- `id` (PK, UUID)
- `invitationId` (FK -> Invitation)
- `versionNo` (int)
- `payloadJson` (JSONB)
- `isSnapshot` (bool, 기본 true)
- `createdAt`

> 에디터 상태 전체를 `payloadJson`으로 저장해 프론트 옵션 확장을 유연하게 유지한다.

## 2.4 PublishLink

- `id` (PK, UUID)
- `invitationId` (FK -> Invitation)
- `slug` (unique, 공개 URL 키)
- `isActive` (bool)
- `publishedAt`
- `expiresAt`
- `createdAt`, `updatedAt`

## 2.5 MediaAsset

- `id` (PK, UUID)
- `invitationId` (FK -> Invitation, nullable)
- `ownerUserId` (FK -> User)
- `storageProvider` (`s3` | `r2`)
- `bucket`
- `objectKey`
- `url`
- `mimeType`
- `sizeBytes`
- `width`/`height` (nullable)
- `durationSec` (nullable)
- `createdAt`

## 2.6 Payment (MVP 준비용)

- `id` (PK, UUID)
- `invitationId` (FK -> Invitation)
- `userId` (FK -> User)
- `amount`
- `currency` (`KRW`)
- `status` (`pending` | `paid` | `failed` | `refunded` | `cancelled`)
- `pgProvider` (nullable)
- `pgOrderId` (nullable)
- `pgTransactionId` (nullable)
- `paidAt` (nullable)
- `createdAt`, `updatedAt`

## 3) 권한/접근 정책

- 로그인 사용자는 본인 `Invitation`만 조회/수정 가능
- `PublishLink` 접근은 공개 API로 허용하되, 아래 조건 모두 확인
  - `isActive = true`
  - `Invitation.status = published`
  - `expiresAt` 미경과
- 만료/비활성 상태면 사용자용 오류 코드 반환 (`404` 또는 `410`)

## 4) API MVP 목록

## 4.1 인증

- `POST /api/auth/login` (OAuth callback 처리)
- `POST /api/auth/logout`
- `GET /api/auth/me`

## 4.2 초대장 관리

- `GET /api/invitations` (내 목록)
- `POST /api/invitations` (생성)
- `GET /api/invitations/:id` (상세 + activeVersion)
- `PATCH /api/invitations/:id` (제목/상태 등 메타 수정)
- `POST /api/invitations/:id/version` (에디터 payload 저장)
- `POST /api/invitations/:id/publish` (발행 + slug 생성/갱신)

## 4.3 공개 조회

- `GET /api/public/:slug` (하객용 렌더 데이터)

## 4.4 미디어

- `POST /api/media/presign` (업로드용 presigned URL 발급)
- `POST /api/media/complete` (업로드 완료 등록)
- `DELETE /api/media/:id` (소유자만 삭제)

## 4.5 결제(2차 연동 전 MVP 준비)

- `POST /api/payments/prepare`
- `POST /api/payments/webhook` (PG 콜백 수신)
- `GET /api/payments/:invitationId`

## 5) 구현 순서 (실행 우선순위)

## Step 1. 인증/세션 골격

- 간편로그인 연결
- `me` API + 보호 라우트 미들웨어

## Step 2. DB 스키마 + 마이그레이션

- User/Invitation/InvitationVersion/PublishLink/MediaAsset/Payment 생성
- 인덱스: `slug unique`, `invitationId+versionNo unique`

## Step 3. 에디터 저장 API

- 버전 저장 API 구현 (`payloadJson`)
- 에디터 초기 로딩을 API 데이터 기반으로 전환

## Step 4. 발행 URL/만료 정책

- publish API + slug 발급
- 만료일 계산(기본 3개월, 플랜별 확장 여지)

## Step 5. 미디어 스토리지 전환

- 현재 로컬 `public/uploads` 경로 의존 제거
- presigned upload + 완료 등록 방식으로 변경

## Step 6. 결제 상태 모델 연결

- 우선 DB/API로 상태만 연결
- 이후 PG 실연동(토스/아임포트 등) 및 webhook 검증

## 6) 운영 정책

- 로그: 인증 실패, 발행 실패, 업로드 실패, 결제 이벤트는 구조화 로그 필수
- 모니터링: API 에러율/응답시간/업로드 실패율 대시보드 구성
- 백업: DB 일일 백업 + 객체 스토리지 버전 관리

## 7) 비기능 요구사항

- API 응답 시간 목표: P95 400ms 이내(단, 업로드/결제 제외)
- 공개 URL 조회는 캐시 전략 도입 가능(변경 시 즉시 무효화)
- 개인정보 최소수집 원칙 준수

## 8) 결정 필요 항목

- 간편로그인 우선순위(카카오 단독 vs 다중 제공자)
- URL 만료 기본값(3개월 vs 6개월)
- 결제 트리거 조건(발행 시점/공유 시점/고급 기능 사용 시점)
- 무료 플랜 범위(저장 개수, 업로드 용량, 유지기간)

---

최종 업데이트: 2026-04-17  
연계 문서: `docs/PRODUCT_STANDARD.md`, `docs/SERVICE_POLICY.md`, `docs/INFRA_STRATEGY.md`
