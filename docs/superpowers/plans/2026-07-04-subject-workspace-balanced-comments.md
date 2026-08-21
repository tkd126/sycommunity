# Subject Workspace and Balanced Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 과목별 파일 업로드에서 영역과 익명 학생 단계를 자동 분석하고, 성취 우선순위와 반 전체 균형을 함께 적용해 지정 개수의 영역으로 평어를 생성한다.

**Architecture:** 분석 API는 원본 성명을 응답하지 않고 학생 번호, 자동 추출 영역명, 단계만 반환한다. 순수 함수가 학생별 상위 수준을 먼저 보장한 뒤 동점 후보를 반 전체 사용량으로 분산한다. UI는 과목별 메모리 작업공간과 드롭존을 제공하고 분석 완료 후에만 익명 학생 표를 만든다.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, OpenAI Responses API

---

### Task 1: 영역 자동 추출과 익명 분석 응답

**Files:**
- Modify: `types/documents.ts`
- Modify: `lib/achievement-parser.ts`
- Modify: `app/api/parse-documents/route.ts`
- Test: `tests/achievement-parser.test.ts`
- Test: `tests/api/parse-documents.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`parseAchievementDocument(text)`가 헤더와 학생 행에서 `areaName`을 반환하고, API 응답 전체에 `김하늘`이 없으며 `roster`도 이름 없이 번호만 반환하는 테스트를 추가한다.

- [ ] **Step 2: 실패 확인**

Run: `node node_modules/vitest/vitest.mjs run tests/achievement-parser.test.ts tests/api/parse-documents.test.ts --pool=threads --maxWorkers=1`
Expected: 영역명 자동 추출 및 이름 제거 기대값 때문에 FAIL.

- [ ] **Step 3: 최소 구현**

다음 계약을 구현한다.

```ts
type ParsedRosterStudent = { studentNumber: number };
function parseAchievementDocument(text: string): {
  areaName: string;
  students: ParsedStudentLevel[];
  roster: ParsedRosterStudent[];
};
```

API 입력의 영역명 의존을 제거하고 파일명은 오류 안내에만 사용한다. 서로 다른 파일에서 같은 번호가 발견되면 번호만 병합한다.

- [ ] **Step 4: 통과 확인**

동일 명령으로 테스트가 통과하는지 확인한다.

### Task 2: 성취 우선·반 전체 균형 영역 선택

**Files:**
- Create: `lib/area-selection.ts`
- Test: `tests/area-selection.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

다음 계약과 사례를 테스트한다.

```ts
function selectBalancedAreas(
  students: Array<{ studentNumber: number; levels: AreaLevel[] }>,
  count: number,
): Array<{ studentNumber: number; selected: AreaLevel[] }>;
```

- 매우 잘함을 잘함보다 먼저 선택
- 같은 단계 후보는 영역별 전체 선택 횟수를 분산
- 같은 입력은 같은 결과 반환
- 균형을 위해 낮은 단계를 선택하지 않음

- [ ] **Step 2: 실패 확인**

Run: `node node_modules/vitest/vitest.mjs run tests/area-selection.test.ts --pool=threads --maxWorkers=1`
Expected: 모듈 부재로 FAIL.

- [ ] **Step 3: 최소 구현**

단계 점수 `매우 잘함=4`, `잘함=3`, `보통=2`, `노력 요함=1`을 적용한다. 학생 번호순으로 처리하며 같은 점수에서는 현재 영역 사용 횟수, 학생 번호 기반 순환 순서, 원래 영역 순서로 정렬한다.

- [ ] **Step 4: 통과 확인**

동일 명령으로 테스트가 통과하는지 확인한다.

### Task 3: 과목별 메모리 작업공간과 드롭존

**Files:**
- Create: `components/FileDropzone.tsx`
- Modify: `components/ReportGenerator.tsx`
- Modify: `lib/report-ui.ts`
- Modify: `types/report.ts`
- Modify: `app/globals.css`
- Test: `tests/file-dropzone.test.tsx`
- Test: `tests/report-generator.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

조회 조건과 초기 학생 표가 없고, 열 가지 과목 선택, 평가 계획·수행평가지·평가결과 드롭존, 반영 영역 수가 보이는지 테스트한다. 파일 드롭과 파일 선택이 같은 콜백을 호출하고 분석 후에만 `1번 학생` 행이 생기는지 테스트한다.

- [ ] **Step 2: 실패 확인**

Run: `node node_modules/vitest/vitest.mjs run tests/file-dropzone.test.tsx tests/report-generator.test.tsx --pool=threads --maxWorkers=1`
Expected: 기존 조회 UI와 초기 행 때문에 FAIL.

- [ ] **Step 3: 최소 구현**

```ts
type SubjectWorkspace = {
  subject: Subject;
  evaluationPlan: File | null;
  worksheets: File[];
  resultFiles: File[];
  selectedAreaCount: number;
  analysis: DocumentAnalysisResponse | null;
};
```

선택 과목별 상태를 컴포넌트 메모리에 보관한다. 직접 영역명 입력과 고정 영역 행을 제거한다. 분석 응답을 받은 뒤 균형 선택 결과로 익명 학생 표를 생성한다.

- [ ] **Step 4: 통과 확인**

관련 컴포넌트 테스트를 통과시킨다.

### Task 4: 생성 요청과 프롬프트 연결

**Files:**
- Modify: `components/ReportGenerator.tsx`
- Modify: `types/report.ts`
- Modify: `lib/prompt.ts`
- Modify: `app/api/generate-report/route.ts`
- Test: `tests/prompt.test.ts`
- Test: `tests/api/generate-report.test.ts`
- Test: `tests/report-generator.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

생성 요청에는 선택된 영역만 들어가고 원래 이름이 없으며, 프롬프트가 성취 우선순위와 선택된 근거만 사용하도록 요구하는지 테스트한다.

- [ ] **Step 2: 실패 확인**

Run: `node node_modules/vitest/vitest.mjs run tests/prompt.test.ts tests/api/generate-report.test.ts tests/report-generator.test.tsx --pool=threads --maxWorkers=1`
Expected: 새 UI 요청 형식과 프롬프트 기대값 때문에 FAIL.

- [ ] **Step 3: 최소 구현**

선택 알고리즘 결과를 `students[].levels`로 보내고 API 스키마가 이름 필드를 허용하지 않도록 유지한다. 화면에는 익명화 보안 안내를 고정 표시한다.

- [ ] **Step 4: 통과 확인**

관련 테스트를 통과시킨다.

### Task 5: 회귀 검증과 문서화

**Files:**
- Modify: `README.md`
- Modify: `docs/solutions/design-patterns/private-school-document-analysis-boundary.md`

- [ ] **Step 1: 전체 검증**

Run: `node node_modules/vitest/vitest.mjs run --pool=threads --maxWorkers=1`
Expected: 모든 테스트 PASS.

- [ ] **Step 2: 타입과 빌드 검증**

Run: `node node_modules/typescript/bin/tsc --noEmit`
Run: `node node_modules/next/dist/bin/next build`
Expected: exit code 0.

- [ ] **Step 3: 브라우저 검증**

로컬 페이지에서 초기 표 미표시, 드롭존, 과목 전환, 분석 후 익명 행, 콘솔 오류 0개를 확인한다.

- [ ] **Step 4: 학습 문서화**

원본 이름을 분석 응답에서 제거하는 경계와 균형 선택의 우선순위 규칙을 `ce-compound` 절차로 기존 해결 문서에 반영한다.
