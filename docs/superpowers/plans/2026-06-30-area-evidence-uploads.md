# 영역별 평가자료 업로드 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 교과별 반영 영역 수에 맞춰 영역명과 필수 평가결과 PDF를 등록하고, 평가 계획·선택 수행평가지·기본 예시문을 관리하는 1단계 업로드 UI를 구현한다.

**Architecture:** 파일은 `File` 객체로 브라우저 상태에만 보관한다. `lib/report-ui.ts`의 순수 함수가 영역 행 크기 조정, 파일 형식 검사, 파일 크기 표시를 담당하고 `ReportGenerator`는 파일 선택과 필수 등록 검증을 담당한다. 파일 본문은 읽거나 서버로 보내지 않는다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library

---

### Task 1: 영역 및 파일 상태 로직

**Files:**
- Modify: `types/report.ts`
- Modify: `tests/report-ui.test.ts`
- Modify: `lib/report-ui.ts`

- [ ] `AreaEvidence` 타입과 `resizeAreaEvidence`, `isAllowedDocument`, `isPdfFile`, `formatFileSize`의 실패 테스트를 작성한다.
- [ ] `pnpm test:run -- tests/report-ui.test.ts`에서 새 테스트가 함수 부재로 실패하는지 확인한다.
- [ ] 앞쪽 영역 값을 보존하며 1개에서 5개로 크기를 조정하는 최소 구현을 작성한다.
- [ ] PDF 전용 검사와 `.hwp`, `.hwpx`, `.pdf` 문서 검사, 사람이 읽기 쉬운 파일 크기 변환을 구현한다.
- [ ] 대상 단위 테스트가 통과하는지 확인한다.

### Task 2: 업로드 필수 조건과 예시문 상호작용

**Files:**
- Modify: `tests/report-generator.test.tsx`
- Modify: `components/ReportGenerator.tsx`

- [ ] 기본 국어 화면에 반영 영역 수 3개와 영역 파일 행 3개가 표시되는 실패 테스트를 작성한다.
- [ ] 영역별 PDF가 없으면 생성이 차단되는 실패 테스트를 작성한다.
- [ ] 영역명 3개와 PDF 3개, 비밀번호를 입력하면 더미 생성이 실행되는 실패 테스트를 작성한다.
- [ ] 평가 계획 파일 1개와 선택 수행평가지 여러 개가 파일명과 크기로 표시되는 실패 테스트를 작성한다.
- [ ] 기본 예시문 3종 선택이 textarea에 반영되고 수정 가능한지 검사한다.
- [ ] 영역 수와 영역 상태, 파일 상태, 예시 선택 상태를 구현해 테스트를 통과시킨다.

### Task 3: 파스텔 업무형 파일 UI

**Files:**
- Modify: `app/globals.css`
- Modify: `README.md`

- [ ] 평가 계획 업로드 카드, 영역별 필수 PDF 행, 선택 수행평가지 카드를 흰색과 파스텔 블루로 구성한다.
- [ ] 필수·선택·등록 완료 상태를 글자와 배지로 함께 구분한다.
- [ ] 실제 파일 경로 대신 파일명과 크기, 삭제 버튼만 표시한다.
- [ ] README에 1단계가 파일 등록 여부만 검증하고 본문 분석은 하지 않는다고 명시한다.

### Task 4: 전체 검증

**Files:**
- Modify: implementation files only when verification exposes a defect

- [ ] `pnpm typecheck`를 실행한다.
- [ ] `pnpm test:run`을 실행한다.
- [ ] `pnpm build`를 실행한다.
- [ ] 1440픽셀 브라우저에서 영역 수 변경, PDF 등록, 필수 누락 차단, 더미 생성, 파일 삭제를 확인한다.
- [ ] 브라우저 콘솔 오류와 Next.js 오류 오버레이가 없는지 확인한다.
