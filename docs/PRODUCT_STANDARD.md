# 모청 제품·서비스 기준 (Product Standard)

본 문서는 모청 서비스의 **운영/제품/기술 기준**을 하나로 모은 최상위 정책서다.
모든 구현 결정은 본 문서를 기준으로 하고, 세부 규정은 다음 문서로 파생한다.

- 연계 문서
  - `docs/SERVICE_POLICY.md` — UI/UX/옵션 정책
  - `docs/BACKEND_MVP_SPEC.md` — 백엔드 도메인/API 스펙
  - `docs/ADMIN_GUIDE.md` — 관리자(마스터) 운영 매뉴얼
  - `docs/INFRA_STRATEGY.md` — 인프라 구성/락인 해제/이관 플레이북

본 문서는 현재 코드(`invitation-builder/*`)에 실제 반영된 상태를 기준으로 작성하며,
아직 반영되지 않은 항목은 “목표”로 별도 표기한다.

---

## 1. 서비스 정의

- 이름: 모청 (dearhour)
- 목적: 사용자가 **쉽고 빠르게 모바일 청첩장을 제작·공유**할 수 있게 한다.
- 도메인 확장 순서
  1) 모바일 청첩장 (1차)
  2) 돌잔치 초대장
  3) 부고 소식
- 플랫폼: 웹(모바일 우선 반응형), `Next.js` 기반.

### 핵심 가치
- 제작 편의성 — 최소 입력, 기본값 우선.
- 즉시 공유성 — 링크 생성·유지·만료가 예측 가능해야 한다.
- 모바일 가독성 — 하객 뷰는 모바일이 기본.
- 낮은 진입장벽 — 회원가입 폼을 요구하지 않는다.

---

## 2. 사용자 주요 플로우

사용자는 아래 한 갈래의 선형 플로우를 기본으로 한다.

```
메인(/)
  → 에디터(/editor, /builder)
     → 저장 시도
        ├─ 비로그인: /login?next=<현재경로>
        │             → 소셜 로그인 → /auth/callback → /mypage
        └─ 로그인: /api/invitations/draft 저장 → /mypage?saved=1
  → 마이페이지(/mypage)
     → 결제(/payment)   ── (PG 연동은 2차)
     → 발행/공유(예정)
```

### 플로우 운영 규칙
- 에디터의 저장 버튼은 **로그인을 강제하지 않고 시도**한다.
- 서버가 `401` 또는 `503(인증 설정 미완료)`을 내면 클라이언트는 즉시 `/login?next=<현재경로>`로 이동한다.
- 로그인 완료 후 사용자는 **원래 경로**로 자동 복귀한다(`next` 파라미터).
- 마이페이지는 **로그인 사용자 전용**이며, 미로그인 접근 시 미들웨어가 `/login?next=...`로 유도한다.

---

## 3. 회원/인증 정책

### 3.1 회원 모델
- 회원가입 폼을 **운영하지 않는다**.
- 모든 계정은 **소셜 간편로그인**으로 생성된다.
- Provider는 **Google / Kakao / Apple** 3종을 기본으로 한다.
  - 네이버/페이스북 등은 후순위 확장.

### 3.2 계정 식별 및 병합
- 내부 식별자: `User.id` (Supabase `auth.users.id` UUID 그대로 사용).
- **이메일은 소문자 정규화** 후 저장.
- 서로 다른 Provider가 동일 이메일로 접근할 경우
  - 기본 정책: **같은 이메일 = 같은 계정**으로 본다.
  - 충돌 발생 시(`Prisma P2002`), 기존 이메일 사용자 행으로 **프로필을 병합 업데이트** 한다.
- 결과적으로 한 이용자당 **1개의 내부 userId**를 유지한다.

### 3.3 세션/보호 라우트
- 세션은 Supabase 쿠키 기반이며, Next.js `middleware.ts`가
  `/mypage`, `/admin`, `/payment` 접근 시 인증 여부를 검사한다.
- 인증 설정 자체가 완료되지 않은 환경에서는 **보호 라우트 접근을 안전하게 실패**시킨다.
  - 비정상 응답(503)에도 저장 UX는 막히지 않고 로그인 페이지로 유도한다.

### 3.4 API (구현 완료)
- `GET /api/auth/me` — 현재 세션 사용자 정보 반환.
- `POST /api/auth/logout` — 서버 세션 종료 + `AuditLog(auth.logout)` 기록.
- `GET /auth/oauth?provider=google|kakao|apple&next=...` — 소셜 로그인 시작.
- `GET /auth/callback?next=...` — 소셜 로그인 콜백 + `syncUserProfile` + `AuditLog(auth.login)`.

### 3.5 권한
- `UserRole` 값: `USER`, `ADMIN`.
- 일반 사용자: 본인 `Invitation`/`Payment` 만 조회/수정.
- 관리자: `/admin` 접근 가능, 전체 회원/결제 현황 조회.

### 3.6 관리자(마스터) 승격 정책
- 별도 “가입 심사” 절차 없음.
- **운영자 이메일로 한 번 로그인** → CLI에서 role을 ADMIN으로 승격.

```bash
# invitation-builder 디렉토리에서 실행
npm run set-admin -- your@email.com
```

- 추가 관리자가 필요할 때도 동일한 방식을 사용한다.
- 관리자 강등이 필요할 경우 동일 스크립트를 확장해 `role=USER`로 되돌린다(향후 작업).
- 상세 운영 절차, 장애 대응, 체크리스트는 `docs/ADMIN_GUIDE.md` 참조.

---

## 4. 데이터 모델 기준 (현재 구현)

실제 Prisma 스키마 기준이며, `BACKEND_MVP_SPEC.md`의 목표 모델과 범위 차이는 “향후”로 명시한다.

### 4.1 현재 모델
- `User { id (UUID, auth.users 연결), email(unique), name, avatarUrl, role, createdAt, updatedAt }`
- `Invitation { id, userId, title, code(unique), status(DRAFT|PUBLISHED|ARCHIVED), content(Json), expiresAt, createdAt, updatedAt }`
- `Payment { id, userId, invitationId?, orderId(unique), provider(TOSS), amount, currency(KRW), status(READY|PAID|FAILED|CANCELED|REFUNDED), paidAt?, ... }`
- `AuditLog { id, userId?, action, targetType?, targetId?, ip, userAgent, payload?, createdAt }`

### 4.2 현재 정책
- 초대장 만료 기본값: **저장 시점으로부터 90일**(추후 플랜별로 상향 가능).
- 초대장 `code`는 6자 대문자/숫자 랜덤.
- 결제는 **상태 모델만 선구축**, 실제 PG는 2차 연동.

### 4.3 향후 확장 (목표)
- `InvitationVersion(payloadJson, versionNo)` — 버전 관리.
- `PublishLink(slug unique, isActive, expiresAt)` — 공개 URL 분리.
- `MediaAsset` — S3/R2 기반 객체 스토리지 연동.

---

## 5. 결제 정책

### 5.1 현재 상태
- UI 및 DB 모델만 구축되어 있으며, **실제 결제 승인 플로우는 미구현**.
- 기본 PG 대상: **토스페이먼츠**.

### 5.2 목표 흐름
```
마이페이지/결제 진입
  → POST /api/payments/prepare (orderId 생성, status=READY)
  → PG 결제창 (토스)
  → PG 콜백 → POST /api/payments/webhook
     → 서버에서 승인 검증 → Payment.status 갱신
  → 성공 시 Invitation.status 변화 또는 기능 해제(예: 워터마크 제거)
```

### 5.3 결제 트리거 (결정 필요)
- 후보
  1) 발행 시점 — 공유 링크 생성 시 결제 필요.
  2) 공유 시점 — 외부 공유 실행 시.
  3) 기능 시점 — 특정 고급 기능(워터마크 제거 등) 사용 시.
- 기본안: **발행 시점 + 기능 시점 혼합** (1+3).

### 5.4 무결성 원칙
- 결제 상태 변경은 반드시 **PG webhook 검증**을 거친 서버 기록을 source of truth로 한다.
- 클라이언트 상태만으로 결제 완료를 판단하지 않는다.

---

## 6. 발행/공유/URL 정책

- 공개 URL은 **고유 slug**로 운영한다. (향후 `PublishLink` 모델)
- 기본 유지 기간: **3~6개월**. 플랜/결제 상태에 따라 연장 가능.
- 만료 이후 접근
  - `410 Gone` 또는 `404 Not Found` 중 하나로 일관되게 반환.
  - 사용자에게 “만료되었습니다” 안내를 보이는 페이지 제공(향후).
- 비활성(`isActive=false`) 링크는 공개 접근 차단.

---

## 7. 미디어/스토리지 정책

### 7.1 현재
- 로컬 `public/uploads/<invitationId>/<...>` 디렉토리 사용.
- 마이페이지가 해당 디렉토리를 스캔해 하객 업로드 미디어를 보여준다.

### 7.2 목표
- S3/R2 등 객체 스토리지로 전환.
- presigned upload → 완료 등록(`POST /api/media/complete`).
- `MediaAsset` 모델 도입 후 로컬 파일 스캔 제거.

---

## 8. 보안/운영 정책

- 민감값은 `.env.local`에 보관하고 커밋 대상에서 제외한다.
- 인증/결제/업로드 이벤트는 **구조화 로그 필수**.
- 로그인/로그아웃은 `AuditLog`에 기록한다(이미 적용됨).
- 공개 URL 조회는 **캐시 전략 도입 가능**, 단 변경 시 즉시 무효화.
- 개인정보 최소 수집 원칙 준수(이메일·이름·아바타 URL 외 수집 지양).
- 관리자 화면(`/admin`)은 `requireAdmin` 가드에 의해서만 접근 허용.

---

## 9. 환경/배포 기준

### 9.1 필수 환경변수 (`.env.local`)
- `NEXT_PUBLIC_APP_URL` — 콜백 URL 기준. 개발: `http://localhost:3001`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` — Supabase Transaction URI(pooled, 앱 런타임)
- `DIRECT_URL` — Supabase Session URI(migrate/db push)

### 9.2 OAuth Redirect URL 등록
- 개발: `http://localhost:3001/auth/callback`
- 배포: `https://<배포도메인>/auth/callback`

### 9.3 초기화 순서
1) Supabase 프로젝트 생성 → URL/anon key/DB URL 발급
2) `.env.local` 값 채우기
3) `npx prisma db push` (스키마 반영)
4) `npm run dev` 재시작
5) `/login`에서 실제 로그인
6) 최초 관리자: `npm run set-admin -- <email>`

---

## 10. 제품 운영 기준 (의사결정 우선순위)

충돌이 발생했을 때 우선순위:

1) 사용자 데이터 안전성 (저장/결제/발행 무결성)
2) 로그인·세션의 안정성
3) 에디터의 “설정-미리보기 일치성”
4) 모바일 하객 뷰의 가독성
5) 신규 기능/효과의 표현력

---

## 11. 변경/릴리즈 기준

- 하나의 사용자 요청 = 가능한 한 한 파일/한 섹션 최소 수정.
- 정책과 코드가 어긋나는 PR은 **정책 문서 업데이트를 병행**한다.
- 린트 통과는 필수, 주요 릴리즈 전 `npm run build` 검증 권장.
- 결제·인증·데이터 모델 변경은 반드시 본 문서 갱신과 함께 머지한다.

---

## 12. 결정 필요 리스트 (Open Questions)

- URL 만료 기본값: **3개월 vs 6개월**.
- 결제 트리거 조합: 발행 시점 / 기능 시점 / 둘 다.
- 무료 플랜 범위: 저장 개수 / 업로드 용량 / 유지 기간.
- Provider 최종 라인업: Google·Kakao·Apple 3종 vs 확장.
- 초대장 버전 관리(`InvitationVersion`) 도입 시점.

---

## 부록 A — 현재 구현 상태 요약

- [x] 소셜 로그인 라우트 (`/auth/oauth`, `/auth/callback`)
- [x] 보호 라우트 미들웨어 (`/mypage`, `/admin`, `/payment`)
- [x] 세션 조회(`GET /api/auth/me`), 서버 로그아웃(`POST /api/auth/logout`)
- [x] 로그인/로그아웃 AuditLog 기록
- [x] 에디터 저장 API(`POST /api/invitations/draft`) + 저장 실패 시 자동 로그인 유도
- [x] 관리자 승격 스크립트(`npm run set-admin -- <email>`)
- [x] 계정 병합(이메일 기준 `P2002` 복구)
- [ ] 실제 PG 결제 승인(`/api/payments/*`)
- [ ] 발행 URL(`PublishLink`) 분리
- [ ] 미디어 스토리지(S3/R2) 전환
- [ ] InvitationVersion 도입

---

최종 업데이트: 2026-04-17
연계 문서: `docs/SERVICE_POLICY.md`, `docs/BACKEND_MVP_SPEC.md`, `docs/ADMIN_GUIDE.md`, `docs/INFRA_STRATEGY.md`
