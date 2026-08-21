# Selection, Creative Export, and Club Wording Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 창체와 동아리의 선택 UX, 유사 활동 처리, 한글 호환 내보내기, 동아리 문장 순서를 검증 가능한 방식으로 개선한다.

**Architecture:** 선택 제어는 각 클라이언트 컴포넌트의 행 상태만 갱신한다. 유사 활동 구체화는 순수 함수로 분리해 API 요청 직전에 적용한다. 문서 내보내기는 현재 화면 상태를 입력받는 순수 생성 함수로 유지하고 HWPX 호환 패키지와 DOCX 보조 파일을 각각 생성한다.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, JSZip

## Global Constraints

- 학생 실명과 원본 파일은 저장하지 않는다.
- 사용자가 수정한 화면 값을 다운로드 시점에 사용한다.
- 창체와 동아리 기록은 자연스러운 한국어 명사형 종결을 유지한다.
- 기존 기능과 세션 저장 동작을 깨뜨리지 않는다.

---

### Task 1: 전체 선택과 전체 선택 해제

**Files:**
- Modify: `components/CreativeActivityGenerator.tsx`
- Modify: `components/ClubActivityGenerator.tsx`
- Test: `tests/creative-activity-generator.test.tsx`
- Test: `tests/club-activity-generator.test.tsx`

**Interfaces:**
- Produces: 각 컴포넌트의 `setAllSelected(selected: boolean): void`

- [ ] **Step 1: Write failing component tests**

창체와 동아리에서 `전체 선택` 클릭 시 모든 체크박스가 선택되고 `전체 선택 해제` 클릭 시 모두 해제되는 테스트를 추가한다.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test:run tests/creative-activity-generator.test.tsx tests/club-activity-generator.test.tsx`

Expected: 버튼을 찾지 못해 실패한다.

- [ ] **Step 3: Add selection controls**

각 컴포넌트에서 `setRows(current => current.map(row => ({ ...row, selected })))`를 호출하는 함수를 만들고 도구 모음에 두 버튼을 배치한다.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm test:run tests/creative-activity-generator.test.tsx tests/club-activity-generator.test.tsx`

Expected: PASS

### Task 2: 유사 활동에서 구체적인 내용 선택

**Files:**
- Modify: `lib/creative-activity.ts`
- Modify: `components/CreativeActivityGenerator.tsx`
- Test: `tests/creative-activity.test.ts`
- Test: `tests/creative-activity-generator.test.tsx`

**Interfaces:**
- Produces: `chooseSpecificCreativeActivity(activity: string): string`
- Consumes: 화면의 `CreativeActivityRow.activity`

- [ ] **Step 1: Write failing pure-function and request tests**

`학교폭력예방교육, 사이버 학교 폭력 교육`이 `사이버 학교 폭력 교육`으로 구체화되고 서로 다른 활동은 유지되는 테스트를 추가한다. 생성 API 요청도 구체화된 값을 사용하는지 검증한다.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test:run tests/creative-activity.test.ts tests/creative-activity-generator.test.tsx`

Expected: 함수가 없거나 요청 원문이 달라 실패한다.

- [ ] **Step 3: Implement conservative specificity selection**

구분자로 나눈 후보를 정규화하고 공통 핵심어가 충분한 후보끼리만 중복으로 판정한다. 더 구체적인 후보를 반환하되 불확실하면 원문을 반환한다. 요청 본문을 만들 때만 적용한다.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm test:run tests/creative-activity.test.ts tests/creative-activity-generator.test.tsx`

Expected: PASS

### Task 3: 한컴 호환 HWPX와 DOCX 보조 다운로드

**Files:**
- Create: `lib/creative-activity-docx.ts`
- Modify: `lib/creative-activity-export.ts`
- Modify: `components/CreativeActivityGenerator.tsx`
- Test: `tests/creative-activity-export.test.ts`
- Test: `tests/creative-activity-generator.test.tsx`

**Interfaces:**
- Produces: `createCreativeActivityHwpx(rows, semester): Promise<Uint8Array>`
- Produces: `createCreativeActivityDocx(rows, semester): Promise<Uint8Array>`

- [ ] **Step 1: Write failing package-compatibility tests**

HWPX가 참고 문서와 같은 필수 엔트리와 한컴 네임스페이스를 포함하고, DOCX가 ZIP 시그니처와 현재 수정 평어를 포함하는지 검증한다.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test:run tests/creative-activity-export.test.ts tests/creative-activity-generator.test.tsx`

Expected: 호환 메타데이터 또는 DOCX 함수·버튼 부재로 실패한다.

- [ ] **Step 3: Implement compatible document packages**

개인정보와 기존 본문이 없는 템플릿 구조에 현재 행을 삽입한다. DOCX에는 동일한 다섯 열 표를 생성하고 별도 다운로드 버튼을 연결한다.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `pnpm test:run tests/creative-activity-export.test.ts tests/creative-activity-generator.test.tsx`

Expected: PASS

### Task 4: 동아리 문장 시간 순서와 간결성

**Files:**
- Modify: `lib/club-record.ts`
- Test: `tests/club-record.test.ts`

**Interfaces:**
- Produces: `generateClubActivityRecord(note: string): string`

- [ ] **Step 1: Write failing wording tests**

블록 건축물 문장이 제작 다음 전시로 끝나고, 전시 뒤에 참여 태도나 세부 표현이 이어지지 않으며, 입력에 없는 태도 표현을 만들지 않는 테스트를 추가한다.

- [ ] **Step 2: Run test and verify RED**

Run: `pnpm test:run tests/club-record.test.ts`

Expected: 현재 문장이 전시 뒤에 참여 태도를 덧붙여 실패한다.

- [ ] **Step 3: Simplify sentence templates**

활동별 결과 동사를 마지막에 두고 입력에 명시된 태도만 한 번 반영한다. 불필요한 기본 참여 문구를 제거한다.

- [ ] **Step 4: Run test and verify GREEN**

Run: `pnpm test:run tests/club-record.test.ts`

Expected: PASS

### Task 5: 전체 회귀 검증과 학습 기록

**Files:**
- Update or Create: `docs/solutions/integration-issues/`

- [ ] **Step 1: Run focused tests**

Run: `pnpm test:run tests/creative-activity.test.ts tests/creative-activity-generator.test.tsx tests/creative-activity-export.test.ts tests/club-activity-generator.test.tsx tests/club-record.test.ts`

- [ ] **Step 2: Run full tests**

Run: `pnpm test:run`

- [ ] **Step 3: Run typecheck and production build**

Run: `pnpm typecheck`

Run: `pnpm build`

- [ ] **Step 4: Run ce-compound lightweight**

HWPX의 MIME만 바꾸는 방식이 충분하지 않았던 원인과 재사용 가능한 검증 방법을 한 개의 해결 문서로 기록하고 기계 검증을 수행한다.
