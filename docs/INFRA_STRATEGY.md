# 인프라 전략 (Infra Strategy)

> 이 문서는 모청(MoCheong) 서비스의 **인프라 구성 기준**과 **벤더 변경 시 이관 전략**을 정의합니다.
> 상위 정책: [`PRODUCT_STANDARD.md`](./PRODUCT_STANDARD.md) · UI/UX: [`SERVICE_POLICY.md`](./SERVICE_POLICY.md) · 백엔드 사양: [`BACKEND_MVP_SPEC.md`](./BACKEND_MVP_SPEC.md) · 운영: [`ADMIN_GUIDE.md`](./ADMIN_GUIDE.md)

## 1. 결정 요약

- **현재 구간(MVP ~ 초기 런칭)**: **Supabase + Vercel** 조합을 표준으로 한다.
  - Auth: Supabase Auth (Google/Kakao/Apple OAuth)
  - DB: Supabase Postgres (Prisma ORM)
  - App Hosting: Vercel (Next.js)
  - Storage(이미지 등): 초기에는 Supabase Storage 또는 Cloudflare R2 중 택1
- **AWS 단독 스택은 현 단계에서 채택하지 않는다.** 서비스 규모가 현재 스펙 + 소폭 확장 범위인 경우 AWS(Cognito/RDS/S3/CloudFront)는 **과도한 운영 부담 대비 이점이 없다.**
- 단, **벤더 종속(lock-in)을 줄이는 설계**는 지금 시점에 반영해 둔다. 아래 "2. 락인 최소화 설계"를 참고한다.

## 2. 락인 최소화 설계 (이미 반영됨)

Supabase Auth가 발급하는 사용자 UUID(`auth.users.id`)에 애플리케이션 데이터 모델이 직접 묶이지 않도록 한다.

- `User.id`: 내부 **cuid**(Supabase와 무관한 자체 식별자)
- `User.authProviderId`: Supabase `auth.users.id`(UUID)를 저장하는 **선택적 유니크 컬럼**
- `Invitation.userId` / `Payment.userId` / `AuditLog.userId`: 모두 **내부 `User.id`(cuid)**를 참조
- `syncUserProfile()`: `authProviderId` → `email` 순으로 기존 사용자를 찾고, 없으면 신규 생성

이 구조의 효과:

- Auth 공급자를 바꿔도(예: Supabase Auth → AWS Cognito / Auth0 / 자체 Auth) 애플리케이션의 비즈니스 데이터는 **그대로 유지**된다.
- 공급자 교체 시 마이그레이션 범위는 **"새 제공자 계정 ↔ 기존 내부 User"를 연결(authProviderId 재매핑)하는 일**로 축소된다.

## 3. 레이어별 이관 난이도

| 레이어 | 현재 | 대체 후보 | 난이도 | 비고 |
| --- | --- | --- | --- | --- |
| App Hosting | Vercel | AWS Amplify / ECS / Fly.io | 낮음 | Next.js 표준 빌드. 환경변수만 이관 |
| DB | Supabase Postgres | AWS RDS / Neon / PlanetScale | 낮음~중간 | `pg_dump` → `pg_restore`. 연결문자열/풀러만 교체 |
| Auth | Supabase Auth | AWS Cognito / Auth0 / 자체 | 중간 | 비밀번호 이관은 불가(소셜은 문제 없음). `authProviderId` 재매핑 |
| Storage | Supabase Storage | Cloudflare R2 / AWS S3 | 낮음 | 객체 키/URL 규칙을 서비스 내부에서 추상화해 두면 교체 용이 |
| Realtime/Edge Fn | Supabase Realtime / Edge | AWS Lambda / API Gateway | 중간 | 사용 범위를 의도적으로 작게 유지한다 |

원칙: **Auth 외에는 어디로든 갈 수 있도록 느슨하게 붙인다.**

## 4. 언제 옮기는가 (Trigger)

아래 조건이 **2개 이상** 충족되기 전까지는 현 구성을 유지한다.

1. 월 활성 사용자(MAU) 5만 명 이상 또는 동시접속 2,000 이상
2. 트래픽/스토리지 비용이 **월 $200 이상**으로 지속 상승
3. 특정 리전/네트워크 규제 요구(예: 국내 데이터 보관 의무) 발생
4. Supabase 장애가 **분기 1회 이상** 서비스 지표에 직접 영향
5. 엔터프라이즈 계약에서 **AWS 스택 요구**가 명시됨

트리거 발생 시 우선순위: **Storage(R2/S3) → DB(RDS/Neon) → Auth(Cognito/Auth0)** 순으로 단계적 이전. App Hosting은 필요 시 마지막에 검토한다.

## 5. 이관 플레이북 (요약)

### 5.1 DB (Supabase Postgres → RDS 등)
1. `pg_dump -Fc --no-owner --no-acl` 로 덤프
2. 타깃에 `pg_restore` 로 복원
3. 애플리케이션의 `DATABASE_URL` / `DIRECT_URL` 교체 후 스테이징 검증
4. 읽기 전용 모드로 Supabase 컷오버 → 타깃으로 최종 동기화 → 전환
5. 롤백 플랜: DNS/커넥션 문자열 즉시 이전 값으로 복귀

### 5.2 Auth (Supabase Auth → 다른 제공자)
1. 신규 제공자에 OAuth 앱 설정 후 **새 `authProviderId`** 발급 체계 구축
2. 첫 재로그인 시 `syncUserProfile()`이 **`email`로 기존 User를 찾아 `authProviderId`만 갱신**
3. 전환 공지(일정 기간 병행) → 구 Auth 비활성화
4. 비밀번호 기반 사용자가 있다면 사용자에게 **재설정 요청** (해시 이관 불가)

### 5.3 Storage (Supabase Storage → R2/S3)
1. 내부에 `storage adapter` 인터페이스 도입 (현재 범위 밖이면 생략)
2. 기존 객체를 일괄 복사 (`rclone` 등)
3. URL 규칙을 서비스에서 추상화된 경로로 제공 → 하부 공급자 교체 가능
4. CDN(CloudFront/Cloudflare)을 Storage 앞에 두어 이전 시 영향 축소

## 6. 로컬/스테이징/프로덕션 구분

- `.env.local`: 개발자 머신용 (커밋 금지)
- Vercel 환경변수: `preview`(스테이징) / `production` 분리
- Supabase 프로젝트: **개발용/운영용 2개 분리 권장** (최소 운영용은 반드시 별도)
- DB 마이그레이션: `npx prisma db push`(개발) / `prisma migrate deploy`(운영)

## 7. 비용 상한 가드레일 (초기)

- Supabase: Free → 필요 시 Pro($25/월). Pro에서 당분간 충분.
- Vercel: Hobby → Pro($20/월) 승격은 커스텀 도메인/팀 협업 시점에 결정.
- 월 총 비용이 $100을 초과하면 스토리지/이미지 사용량을 우선 점검한다 (이미지 용량 이슈가 가장 흔함).

## 8. 열린 질문

- 이미지 스토리지 최종 선택 (Supabase Storage vs Cloudflare R2): 월 용량/대역폭 실측 후 결정
- 카카오/애플 OAuth 실계정 연동 일정
- 결제(PG) 사업자 확정 및 관련 개인정보 처리 범위

---

## 변경 이력

- 2026-04-17: 초판 작성. MVP~초기 런칭 기준 Supabase + Vercel 확정. `User.id`/`authProviderId` 분리로 Auth 공급자 락인 해제.
