# Automatic Roster Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 영역별 평가 PDF 분석 결과로 학생 명렬표와 표 행을 자동 동기화하고 성명은 로컬 화면에만 유지한다.

**Architecture:** 문서 파서는 이름 없는 단계 자료와 이름 있는 자료를 모두 처리해 별도의 로컬 명렬표를 만든다. 분석 API가 영역 결과와 병합 명렬표를 반환하고, 순수 UI 동기화 함수가 번호 기준으로 학생 행을 재구성한다. 생성 API 요청 타입은 그대로 유지하여 성명이 경계를 넘지 않게 한다.

**Tech Stack:** Next.js App Router, TypeScript, React, Vitest, Testing Library

---

### Task 1: 학생 성명 추출과 영역 명렬표 병합

**Files:**
- Modify: `types/documents.ts`
- Modify: `lib/achievement-parser.ts`
- Modify: `app/api/parse-documents/route.ts`
- Test: `tests/achievement-parser.test.ts`
- Test: `tests/api/parse-documents.test.ts`

- [x] 이름 포함 행, 이름 없는 행, 영역명 포함 행의 실패 테스트를 추가한다.
- [x] 테스트를 실행해 명렬표 API 부재로 실패하는지 확인한다.
- [x] `ParsedRosterStudent`와 이름 추출 결과를 구현한다.
- [x] 번호 기준 병합과 성명 충돌 경고를 구현한다.
- [x] 관련 테스트를 다시 실행해 통과시킨다.

### Task 2: 분석 결과에 맞춘 학생 행 자동 생성과 제거

**Files:**
- Modify: `lib/report-ui.ts`
- Modify: `components/ReportGenerator.tsx`
- Test: `tests/report-ui.test.ts`
- Test: `tests/report-generator.test.tsx`

- [x] 분석된 번호에 맞춰 행을 정확히 재구성하는 실패 테스트를 추가한다.
- [x] 테스트를 실행해 동기화 함수 부재로 실패하는지 확인한다.
- [x] 기존 교사 수정값을 번호 기준으로 보존하는 동기화 함수를 구현한다.
- [x] 분석 완료 시 동기화 함수를 적용하고 수동 행 버튼을 제거한다.
- [x] 생성 요청에 성명이 포함되지 않음을 포함한 UI 테스트를 통과시킨다.

### Task 3: 검토 표의 로컬 성명 표시

**Files:**
- Modify: `components/DocumentReviewPanel.tsx`
- Test: `tests/document-review-panel.test.tsx`

- [x] 번호에 대응하는 성명을 표시하는 실패 테스트를 추가한다.
- [x] 명렬표 속성과 성명 열을 구현한다.
- [x] 컴포넌트 테스트를 통과시킨다.

### Task 4: 회귀 검증과 문서화

**Files:**
- Modify: `README.md`
- Modify: `docs/solutions/design-patterns/private-school-document-analysis-boundary.md`

- [x] 개인정보 처리 설명을 로컬 명렬표 경계와 일치하도록 수정한다.
- [x] 전체 테스트와 타입 검사를 실행한다.
- [x] 프로덕션 빌드를 실행한다.
- [x] 로컬 브라우저와 실제 익명 PDF API 분석으로 행 수와 이름 처리를 확인한다.
- [x] 실행·검토 중 얻은 재사용 가능한 교훈을 `ce-compound` 절차로 기록한다.
