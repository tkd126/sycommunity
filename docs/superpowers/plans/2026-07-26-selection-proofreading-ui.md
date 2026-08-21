# Selection And Proofreading UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 표 머리글 전체선택, 간결한 생성 도구 모음, 창체 UI 정돈, 개인정보를 제외한 전체 결과 맞춤법 검사를 구현한다.

**Architecture:** 공통 `useTableSelectionState` 없이 각 기존 컴포넌트의 행 상태를 그대로 사용하고, 재사용 가능한 `HeaderSelectionCheckbox`만 추가해 중간 선택 상태를 DOM에 반영한다. 맞춤법 검사는 공통 `/api/proofread` 서버 라우트와 `lib/proofread.ts`에 집중하며 세 화면은 결과 문장과 임의 행 ID만 전송한다.

**Tech Stack:** Next.js App Router, React 19, TypeScript, OpenAI Responses API, Zod, Vitest, Testing Library

## Global Constraints

- 학생 이름, 학생 번호, 첨부 파일, 평가결과 원문, 활동 원문을 맞춤법 검사 요청에 포함하지 않는다.
- 기존 로그인 승인, 교사 비밀번호, 월 예산, IP 빈도 제한, 최소 사용량 기록 규칙을 유지한다.
- 맞춤법 검사는 문장 사실·수준·문장 수·명사형 종결을 바꾸지 않는다.
- 기존 사용자 변경을 되돌리거나 관련 없는 파일을 정리하지 않는다.

---

### Task 1: 표 머리글 전체선택과 도구 모음 정리

**Files:**
- Create: `components/HeaderSelectionCheckbox.tsx`
- Modify: `components/ReportGenerator.tsx`
- Modify: `components/ClubActivityGenerator.tsx`
- Modify: `components/CreativeActivityGenerator.tsx`
- Modify: `app/globals.css`
- Test: `tests/report-generator.test.tsx`
- Test: `tests/club-activity-generator.test.tsx`
- Test: `tests/creative-activity-generator.test.tsx`

**Interfaces:**
- Produces: `HeaderSelectionCheckbox({ selectedCount, totalCount, disabled, onChange, label })`
- Consumes: 각 화면의 기존 `setAllSelected(selected: boolean)` 함수

- [ ] **Step 1: Write failing component tests**

세 화면의 표 머리글에 `전체 행 선택` 체크박스가 있고 클릭 시 전체 선택·해제가 되며, 별도 `전체 선택`/`전체 선택 해제` 버튼이 없음을 검증한다. 동아리의 `선택 학생만 생성`/`전체 학생 생성`과 창체의 `검토 관리` 버튼이 사라지는지도 검증한다.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test:run tests/report-generator.test.tsx tests/club-activity-generator.test.tsx tests/creative-activity-generator.test.tsx`
Expected: 머리글 체크박스 미존재와 기존 버튼 존재로 FAIL.

- [ ] **Step 3: Implement header checkbox and toolbar simplification**

`HeaderSelectionCheckbox`에서 `ref.current.indeterminate = selectedCount > 0 && selectedCount < totalCount`를 적용한다. 세 표의 `선택` 텍스트 옆에 컴포넌트를 배치하고 별도 선택 그룹을 제거한다. 동아리는 스마트 생성 버튼 하나만 남기며, 창체는 검토 그룹과 확인 상태 열을 제거한다.

- [ ] **Step 4: Make creative generation validate current row values**

창체 `generate`는 `needsReview` 플래그를 차단 조건으로 사용하지 않고 `rowProblems(row)` 결과만 검사한다. 날짜·시수·구분·활동이 유효하면 별도 확인 버튼 없이 생성한다.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `pnpm test:run tests/report-generator.test.tsx tests/club-activity-generator.test.tsx tests/creative-activity-generator.test.tsx`
Expected: PASS.

### Task 2: 개인정보 경계를 지키는 맞춤법 검사 서버

**Files:**
- Create: `lib/proofread.ts`
- Create: `app/api/proofread/handler.ts`
- Create: `app/api/proofread/route.ts`
- Modify: `lib/rate-limit.ts`
- Test: `tests/proofread.test.ts`
- Test: `tests/api/proofread.test.ts`

**Interfaces:**
- Produces: `proofreadRequestSchema`, `proofreadComments(input, creator, model)`
- Request: `{ password: string; rows: Array<{ id: string; comment: string }> }`
- Response: `{ rows: Array<{ id: string; comment: string }>; usage: { amountKrw: number; budgetKrw: number } }`

- [ ] **Step 1: Write failing library tests**

스키마가 ID와 결과 문장 이외의 이름·번호·원문 필드를 거부하고, 응답 ID 누락·중복을 거부하며, 교정 요청 프롬프트에 문법·띄어쓰기·중복 표현 교정과 사실 보존 규칙이 포함되는지 검증한다.

- [ ] **Step 2: Run library tests and verify RED**

Run: `pnpm test:run tests/proofread.test.ts`
Expected: `@/lib/proofread` 미존재로 FAIL.

- [ ] **Step 3: Implement proofread library**

최대 50행, 문장당 2,000자, 전체 30,000자로 제한하는 strict Zod schema와 strict JSON schema 응답 파서를 구현한다. 입력 ID와 응답 ID가 정확히 일치할 때만 정제된 결과를 반환한다.

- [ ] **Step 4: Write failing API tests**

미로그인 401, 미승인 403, 잘못된 비밀번호 401, 한도 초과 429, 성공 시 비용 기록과 원문 비저장을 검증한다.

- [ ] **Step 5: Run API tests and verify RED**

Run: `pnpm test:run tests/api/proofread.test.ts`
Expected: 라우트 미존재로 FAIL.

- [ ] **Step 6: Implement proofread API**

기존 `handleGenerateReport` 흐름과 동일하게 인증, strict body validation, timing-safe password, rate limit, 월 사용량, OpenAI 호출, 비용 계산, 사용량 저장 순서로 구현한다. 오류 응답에는 교정 원문을 포함하지 않는다.

- [ ] **Step 7: Run server tests and verify GREEN**

Run: `pnpm test:run tests/proofread.test.ts tests/api/proofread.test.ts`
Expected: PASS.

### Task 3: 세 화면 전체 결과 맞춤법 검사와 되돌리기

**Files:**
- Create: `lib/proofread-client.ts`
- Modify: `components/ReportGenerator.tsx`
- Modify: `components/ClubActivityGenerator.tsx`
- Modify: `components/CreativeActivityGenerator.tsx`
- Test: `tests/proofread-client.test.ts`
- Test: `tests/report-generator.test.tsx`
- Test: `tests/club-activity-generator.test.tsx`
- Test: `tests/creative-activity-generator.test.tsx`

**Interfaces:**
- Produces: `proofreadInBatches({ password, rows, onProgress })`
- Consumes: `{ id: string; comment: string }[]`, 최대 50개 단위로 `/api/proofread` 호출

- [ ] **Step 1: Write failing client and component tests**

결과 없는 경우 호출하지 않음, 요청 body에 ID와 comment만 포함, 50개 단위 분할, 교정 결과 전체 적용, 누락 시 미적용, `검사 전으로 되돌리기` 복원을 검증한다.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test:run tests/proofread-client.test.ts tests/report-generator.test.tsx tests/club-activity-generator.test.tsx tests/creative-activity-generator.test.tsx`
Expected: 맞춤법 검사 버튼과 클라이언트 함수 미존재로 FAIL.

- [ ] **Step 3: Implement batched client**

각 응답의 ID 집합을 요청과 비교하고 모두 일치할 때만 누적 결과를 반환한다. `onProgress(completed, total)`로 화면 알림을 갱신한다.

- [ ] **Step 4: Add proofreading and undo state to three screens**

각 화면에서 결과가 있는 행만 `id/comment`로 전달하고, 성공 직전 현재 문장을 백업한 뒤 결과를 적용한다. 검사 중 버튼을 비활성화하고 진행 개수·백분율을 표시한다. 실패하면 기존 문장을 유지한다.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `pnpm test:run tests/proofread-client.test.ts tests/report-generator.test.tsx tests/club-activity-generator.test.tsx tests/creative-activity-generator.test.tsx`
Expected: PASS.

### Task 4: 창체 상단 정돈과 전체 회귀 검증

**Files:**
- Modify: `app/globals.css`
- Test: `tests/creative-activity-generator.test.tsx`

**Interfaces:**
- Consumes: 기존 `.creative-upload-panel`, `.creative-access-controls`
- Produces: 넓은 화면 한 줄 정렬과 좁은 화면 자연스러운 두 줄 배치

- [ ] **Step 1: Add failing UI structure assertions**

파일 영역과 접근 설정 영역에 명확한 레이블이 있고 분석 버튼 문구가 줄바꿈되지 않는 구조를 검증한다.

- [ ] **Step 2: Run test and verify RED**

Run: `pnpm test:run tests/creative-activity-generator.test.tsx`
Expected: 새 레이블 또는 구조 미존재로 FAIL.

- [ ] **Step 3: Implement compact responsive layout**

업로드 패널을 `minmax(360px, 1fr)`와 접근 설정 열로 구성하고, 설정 컨트롤 높이·간격을 통일하며 분석 버튼에 `white-space: nowrap`을 적용한다. 1100px 이하에서는 한 열로 전환한다.

- [ ] **Step 4: Run full verification**

Run: `pnpm test:run`
Expected: 모든 테스트 PASS.

Run: `pnpm typecheck`
Expected: exit 0.

Run: `pnpm build`
Expected: exit 0.

- [ ] **Step 5: Browser QA**

로컬 서버에서 교과·동아리·창체 화면을 열고 표 머리글 선택, 동아리 단일 생성 버튼, 창체 레이아웃, 맞춤법 검사와 되돌리기를 확인한다.
