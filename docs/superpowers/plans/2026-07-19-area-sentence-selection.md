# 교과 평어 영역별 문장 보장 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 반영 영역 수만큼 상위 성취 영역을 균형 있게 고르고, 선택 영역마다 정확히 한 문장의 평어를 생성하며, 성취 단계 선택지가 잘리지 않는 표를 제공한다.

**Architecture:** 영역 선택은 기존 `selectBalancedAreas`의 등급 우선 정렬을 유지한다. OpenAI 응답은 학생별 `areaComments` 배열로 받고 서버가 입력 영역과 개수·이름을 대조한 뒤 기존 `comment` 문자열로 결합한다. 화면은 영역 열을 넓히고 종합의견 열의 최소 폭을 줄여 전체 폭을 재배분한다.

**Tech Stack:** Next.js App Router, TypeScript, Zod, OpenAI Responses API JSON Schema, Vitest, Tailwind/CSS

## Global Constraints

- 영역 우선순위는 `매우 잘함`, `잘함`, `보통`, `노력 요함` 순서이며 낮은 단계를 균형 때문에 앞세우지 않는다.
- 같은 성취 단계 안에서만 반 전체 영역 사용량을 균형 있게 분산한다.
- 반영 영역 하나당 정확히 한 문장을 생성한다.
- 학생 이름은 OpenAI에 전송하지 않는다.
- 기존 인증, 사용량 제한, 파일 분석, 브라우저 세션 저장 동작은 바꾸지 않는다.
- 기존 작업트리의 관련 없는 사용자 변경은 되돌리지 않는다.

---

### Task 1: 영역 선택 회귀 기준 고정

**Files:**
- Modify: `tests/area-selection.test.ts`
- Verify: `lib/area-selection.ts`

**Interfaces:**
- Consumes: `selectBalancedAreas(students, count)`
- Produces: 학생별 정확한 `count`개의 우선순위·균형 선택 결과

- [ ] **Step 1: 실패 가능성을 막는 회귀 테스트 추가**

```ts
it("네 영역에서 세 영역을 요청하면 상위 단계 세 개만 정확히 선택한다", () => {
  const [result] = selectBalancedAreas([{ studentNumber: 1, levels: [
    { areaName: "1영역", level: "매우 잘함" },
    { areaName: "2영역", level: "매우 잘함" },
    { areaName: "3영역", level: "잘함" },
    { areaName: "4영역", level: "노력 요함" },
  ]}], 3);
  expect(result.selected.map(({ areaName }) => areaName)).toEqual(["1영역", "2영역", "3영역"]);
});
```

- [ ] **Step 2: 영역 선택 테스트 실행**

Run: `pnpm test:run tests/area-selection.test.ts`
Expected: PASS. 기존 알고리즘이 요구사항을 만족하는 근거로 삼고 불필요한 구현 변경을 하지 않는다.

### Task 2: 영역별 구조화 응답과 서버 검증

**Files:**
- Modify: `tests/api/generate-report.test.ts`
- Modify: `lib/openai.ts`
- Modify: `types/report.ts`

**Interfaces:**
- Consumes: `GenerateReportRequest.students[].levels`
- Produces: 모델 내부 응답 `areaComments: Array<{areaName: string; comment: string}>`, 프론트엔드 호환 응답 `comment: string`

- [ ] **Step 1: 정확한 영역 수, 영역명, 결합 순서를 요구하는 실패 테스트 작성**

```ts
expect(result.rows[0].comment).toBe("문학 평어 문장. 읽기 평어 문장. 쓰기 평어 문장.");
await expect(generateReports(input, creatorWithTwoAreaComments)).rejects.toThrow("영역별 평어 수");
await expect(generateReports(input, creatorWithWrongAreaName)).rejects.toThrow("선택 영역");
```

- [ ] **Step 2: 테스트가 기존 `comment` 응답 구조 때문에 실패하는지 확인**

Run: `pnpm test:run tests/api/generate-report.test.ts`
Expected: FAIL because `areaComments` is not accepted or validated.

- [ ] **Step 3: JSON 스키마와 Zod 스키마를 영역별 응답으로 변경**

```ts
areaComments: z.array(z.object({
  areaName: z.string().min(1),
  comment: z.string().min(1),
}).strict()).min(1).max(10)
```

- [ ] **Step 4: 학생별 입력 영역과 응답 영역을 순서까지 검증하고 문장을 결합**

```ts
const expectedAreas = inputStudent.levels.map(({ areaName }) => areaName);
if (row.areaComments.length !== expectedAreas.length) throw new Error("영역별 평어 수가 선택 영역 수와 일치하지 않습니다.");
if (!expectedAreas.every((name, index) => row.areaComments[index]?.areaName === name)) {
  throw new Error("영역별 평어가 선택 영역과 일치하지 않습니다.");
}
const comment = row.areaComments.map(({ comment }) => sanitizeComment(comment)).join(" ");
```

- [ ] **Step 5: API 테스트 재실행**

Run: `pnpm test:run tests/api/generate-report.test.ts`
Expected: PASS.

### Task 3: 영역당 한 문장 프롬프트

**Files:**
- Modify: `tests/prompt.test.ts`
- Modify: `lib/prompt.ts`

**Interfaces:**
- Consumes: 이미 선택된 학생별 영역과 단계
- Produces: 선택 영역별 한 문장을 요구하는 JSON 전용 프롬프트

- [ ] **Step 1: 프롬프트 실패 테스트 작성**

```ts
expect(prompt).toContain("선택 영역 하나당 정확히 한 문장");
expect(prompt).toContain("areaComments");
expect(prompt).toContain("입력에 제시된 영역 순서");
```

- [ ] **Step 2: 테스트가 기존 프롬프트에서 실패하는지 확인**

Run: `pnpm test:run tests/prompt.test.ts`
Expected: FAIL because the per-area sentence contract is missing.

- [ ] **Step 3: 작성 규칙과 JSON 예시를 구조화 응답에 맞게 변경**

```text
- 선택 영역 하나당 정확히 한 문장만 작성한다.
- areaComments는 입력에 제시된 영역 순서를 유지한다.
- 여러 영역을 한 문장으로 합치거나 한 영역을 두 문장 이상으로 나누지 않는다.
```

- [ ] **Step 4: 프롬프트 테스트 재실행**

Run: `pnpm test:run tests/prompt.test.ts`
Expected: PASS.

### Task 4: 결과표 열 너비 재배분

**Files:**
- Modify: `tests/report-table-layout.test.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `.student-table--subject-result` 열 클래스
- Produces: 잘리지 않는 성취 단계 선택지와 줄어든 종합의견 열

- [ ] **Step 1: 열 너비 회귀 테스트 작성**

```ts
expect(css).toMatch(/\.student-table--subject-result\s+\.col-area-level\s*\{[^}]*width:\s*104px/);
expect(css).toMatch(/\.student-table--subject-result\s+\.col-comment\s*\{[^}]*min-width:\s*220px/);
```

- [ ] **Step 2: 기존 82px/280px 때문에 테스트가 실패하는지 확인**

Run: `pnpm test:run tests/report-table-layout.test.ts`
Expected: FAIL with the old widths.

- [ ] **Step 3: 영역 열을 104px로 넓히고 종합의견 최소 폭을 220px로 조정**

```css
.student-table--subject-result .col-area-level { width: 104px; }
.student-table--subject-result .col-comment { width: auto; min-width: 220px; }
.student-table--subject-result .level-select { width: 100%; min-width: 0; }
```

- [ ] **Step 4: 레이아웃 테스트 재실행**

Run: `pnpm test:run tests/report-table-layout.test.ts`
Expected: PASS.

### Task 5: 통합 회귀 검증과 교훈 문서화

**Files:**
- Create: `docs/solutions/report-generation/structured-area-comments.md`

**Interfaces:**
- Consumes: Tasks 1–4 결과
- Produces: 검증 기록과 재사용 가능한 구현 교훈

- [ ] **Step 1: 관련 테스트 전체 실행**

Run: `pnpm test:run tests/area-selection.test.ts tests/api/generate-report.test.ts tests/prompt.test.ts tests/report-table-layout.test.ts`
Expected: all tests PASS.

- [ ] **Step 2: 프로젝트 전체 테스트 실행**

Run: `pnpm test:run`
Expected: 신규 회귀 없음. 기존에 알려진 창체 CSV Blob 테스트가 실패하면 신규 변경과 분리해 기록한다.

- [ ] **Step 3: 타입 검사 실행**

Run: `pnpm typecheck`
Expected: 수정 파일에서 새 타입 오류가 없다. 기존에 알려진 Next 라우트와 창체 오류는 분리해 기록한다.

- [ ] **Step 4: ce-compound 방식으로 해결 과정 문서화**

문서에는 문자열 하나만 받는 생성 응답이 개수 보장을 할 수 없었던 원인, 구조화 배열과 서버 대조 검증을 사용한 해결법, 같은 문제를 반복하지 않을 점을 기록한다.
