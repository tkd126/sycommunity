# 생기부 도우미 별도 배포 및 도구함 연결 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 생기부 도우미를 별도 HTTPS 주소로 배포하고 기존 `sycommunity` 도구함에서 안전한 새 탭 링크로 연다.

**Architecture:** Next.js 생기부 도우미는 `codex/student-record-helper-terra` 브랜치를 Vercel의 별도 프로젝트로 배포한다. 기존 Vite 도구함의 `main`에는 외부 서비스 주소를 가진 앱 카드만 추가하여 두 서비스의 서버 API와 환경변수를 분리한다.

**Tech Stack:** Next.js 16, NextAuth, Prisma/PostgreSQL, OpenAI Responses API, Vercel, Vite/React

**Spec:** `docs/superpowers/specs/2026-08-21-separate-deployment-and-toolbox-link-design.md`

## Global Constraints

- API 키, DB 비밀번호, OAuth 비밀값, `NEXTAUTH_SECRET`는 Git에 커밋하지 않는다.
- 기본 모델은 `gpt-5.6-terra`, 입력 단가는 `2.00`, 출력 단가는 `12.00` USD/1M tokens로 유지한다.
- 기존 `sycommunity`의 `main` Vite 앱은 삭제하거나 Next.js로 교체하지 않는다.
- 도구함 링크는 `target="_blank"`와 `rel="noopener noreferrer"`를 유지한다.
- 공개 배포에서는 클라우드 PostgreSQL `DATABASE_URL`을 사용한다.

---

### Task 1: 배포 환경 설정을 검증한다

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Test: `tests/server-config.test.ts`

**Interfaces:**
- Consumes: Vercel 서버 환경변수
- Produces: `readServerConfig(env)`의 Terra 모델·단가 설정

- [ ] **Step 1: 기본값 테스트를 작성 또는 확인한다**

```ts
expect(config).toMatchObject({
  model: "gpt-5.6-terra",
  inputPricePer1MUsd: 2,
  outputPricePer1MUsd: 12,
});
```

- [ ] **Step 2: 테스트를 실행해 통과를 확인한다**

Run: `pnpm test:run tests/server-config.test.ts`

Expected: Terra 모델과 가격 기본값 테스트가 통과한다.

- [ ] **Step 3: 예시 환경변수와 문서를 확인한다**

```dotenv
OPENAI_MODEL=gpt-5.6-terra
INPUT_PRICE_PER_1M_USD=2.00
OUTPUT_PRICE_PER_1M_USD=12.00
```

`.env.example`에는 빈 값 또는 예시 값만 남기고 `.env.local`은 Git에서 제외한다. README에는 Vercel에서 등록할 환경변수와 `NEXTAUTH_URL`이 실제 배포 주소여야 한다는 점을 명시한다.

- [ ] **Step 4: 배포 빌드를 검증한다**

Run: `pnpm typecheck && pnpm build`

Expected: Next.js 서버 라우트가 포함된 프로덕션 빌드가 통과한다.

- [ ] **Step 5: 커밋한다**

```bash
git add .env.example README.md tests/server-config.test.ts
git commit -m "docs: prepare Terra deployment configuration"
```

### Task 2: Vercel, DB, Google OAuth를 설정한다

**Files:**
- Modify: Vercel 프로젝트 환경변수 (Git에 저장하지 않음)
- Modify: Google Cloud OAuth 클라이언트 승인 리디렉션 URI (Git에 저장하지 않음)
- Modify: 클라우드 PostgreSQL 스키마

**Interfaces:**
- Consumes: `codex/student-record-helper-terra`, Vercel 도메인, 클라우드 `DATABASE_URL`
- Produces: HTTPS 생기부 도우미 URL과 Google 로그인 콜백

- [ ] **Step 1: Vercel 프로젝트를 만든다**

`tkd126/sycommunity` 저장소를 가져오고 Production Branch를 `codex/student-record-helper-terra`로 지정한다. Framework Preset은 Next.js, Root Directory는 저장소 루트로 둔다.

- [ ] **Step 2: 서버 환경변수를 등록한다**

```text
OPENAI_API_KEY
OPENAI_MODEL=gpt-5.6-terra
MONTHLY_BUDGET_KRW
USD_KRW_RATE
INPUT_PRICE_PER_1M_USD=2.00
OUTPUT_PRICE_PER_1M_USD=12.00
TEACHER_ACCESS_PASSWORD
DATABASE_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET
NEXTAUTH_URL=https://<vercel-domain>
ADMIN_EMAIL
```

실제 값은 Vercel의 Production 및 Preview 환경에만 입력한다.

- [ ] **Step 3: 클라우드 DB 스키마를 적용한다**

```bash
pnpm prisma generate
pnpm prisma db push
```

Expected: 인증, 사용량, 저장 평어 테이블이 클라우드 PostgreSQL에 생성된다.

- [ ] **Step 4: Google OAuth 콜백을 등록한다**

```text
https://<vercel-domain>/api/auth/callback/google
```

- [ ] **Step 5: 공개 배포를 확인한다**

브라우저에서 HTTPS 주소를 열고 Google 로그인, 관리자 승인, 비승인 사용자 생성 차단, Terra 단가 사용량 표시를 확인한다.

### Task 3: 기존 도구함에 생기부 도우미 카드를 추가한다

**Files:**
- Modify: `sycommunity` 작업트리의 `src/data/apps.js`
- Test: `sycommunity` 작업트리의 `npm run build`

**Interfaces:**
- Consumes: Task 2에서 확정된 `https://<vercel-domain>` URL
- Produces: `apps` 배열의 `student-record-helper` 객체

- [ ] **Step 1: 기존 `main`에서 전용 작업트리를 만든다**

```bash
git fetch origin main
git worktree add .worktrees/sycommunity-main -b codex/sycommunity-student-record-link origin/main
```

- [ ] **Step 2: 카드가 아직 없는 상태를 확인한다**

Run: `rg -n 'student-record-helper' src/data/apps.js`

Expected: 일치 항목이 없다.

- [ ] **Step 3: 앱 객체를 배열 앞쪽에 추가한다**

```js
{
  id: "student-record-helper",
  title: "생기부 도우미",
  description:
    "수행평가 자료를 바탕으로 교과 평어, 동아리 활동 기록, 창의적 체험활동 평어를 작성하고 검토하는 교사용 업무 도구입니다.",
  subject: "창체",
  grade: "공통",
  tags: ["생기부", "교과평어", "동아리활동", "창체", "교사용"],
  url: "https://<vercel-domain>",
},
```

기존 `AppCard.jsx`는 외부 URL을 새 탭에서 `noopener noreferrer`로 열므로 수정하지 않는다.

- [ ] **Step 4: Vite 빌드를 실행한다**

Run: `npm install && npm run build`

Expected: 빌드가 통과하고 카드는 `앱 열기` 상태가 된다.

- [ ] **Step 5: 브라우저에서 새 탭 연결을 확인한다**

도구함 카드 클릭 시 Task 2의 HTTPS 주소가 새 탭에서 열리고 원래 도구함 탭은 유지된다.

- [ ] **Step 6: 커밋과 푸시를 수행한다**

```bash
git add src/data/apps.js
git commit -m "feat: link student record helper from toolbox"
git push -u origin codex/sycommunity-student-record-link
```

### Task 4: 공개 전 보안 상태를 점검한다

**Files:**
- Modify: `README.md` (운영 URL 또는 절차가 바뀌는 경우)
- Test: GitHub·Vercel 환경변수와 배포 로그

**Interfaces:**
- Consumes: Task 2 배포와 Task 3 링크
- Produces: 배포 가능한 보안 점검 결과

- [ ] **Step 1: 저장소 비밀값 제외 상태를 확인한다**

```bash
git check-ignore -v .env.local
git grep -n -E 'sk-[A-Za-z0-9_-]{20,}|GOOGLE_CLIENT_SECRET=[^[:space:]]+' -- .
```

Expected: `.env.local`은 ignore 규칙에 일치하고 실제 비밀값 검색 결과는 없다.

- [ ] **Step 2: 배포 로그를 확인한다**

학생 이름, 업로드 문서 원문, API 키, DB 연결 문자열이 로그에 없음을 확인한다.

- [ ] **Step 3: 장애 분리를 확인한다**

Preview 환경에서 생기부 도우미 API 키를 비활성화해 생성 요청이 거절되는지 확인하고, 기존 도구함이 계속 열리는지 확인한다.

- [ ] **Step 4: 롤백 기준을 기록한다**

Vercel 이전 배포로 되돌릴 수 있는지 확인하고, 검증된 HTTPS 주소일 때만 도구함 카드 브랜치를 `main`에 병합한다.

- [ ] **Step 5: 커밋한다**

```bash
git add README.md
git commit -m "docs: add deployment security checklist"
```

