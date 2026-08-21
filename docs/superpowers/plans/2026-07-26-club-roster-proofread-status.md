# Club Roster and Proofread Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 동아리 학생 수를 1~40명으로 조정하고 학생별 맞춤법 검사 결과 상태를 표시한다.

**Architecture:** `ClubActivityGenerator`의 행 상태에 맞춤법 상태를 추가하고, 학생 수 입력은 현재 행 배열을 보존·확장·절단하는 방식으로 적용한다. 맞춤법 응답은 원문과 비교해 행별 상태를 계산한다.

**Tech Stack:** Next.js, React, TypeScript, Testing Library, Vitest

## Global Constraints

- 학생 수는 1~40명이다.
- 기존 앞번호 행의 작성 내용은 인원 조정 시 보존한다.
- 맞춤법 상태는 원문과 응답의 실제 문자열 비교로 판정한다.
- 학생 실명은 저장하거나 전송하지 않는다.

---

### Task 1: 학생 수 목록 조정

**Files:**
- Modify: `tests/club-activity-generator.test.tsx`
- Modify: `components/ClubActivityGenerator.tsx`

- [ ] 학생 수 8명 확장과 3명 축소 시 기존 첫 행 내용 보존 테스트를 작성한다.
- [ ] 테스트를 실행해 학생 수 입력이 없어 실패함을 확인한다.
- [ ] 1~40 숫자 입력과 `학생 목록 만들기` 버튼을 구현한다.
- [ ] 관련 테스트를 다시 실행해 통과를 확인한다.

### Task 2: 학생별 맞춤법 상태

**Files:**
- Modify: `tests/club-activity-generator.test.tsx`
- Modify: `components/ClubActivityGenerator.tsx`
- Modify: `app/globals.css`

- [ ] 동일 응답은 `문제 없음`, 변경 응답은 `수정됨`으로 표시하는 테스트를 작성한다.
- [ ] 테스트를 실행해 상태 배지가 없어 실패함을 확인한다.
- [ ] 행별 상태 계산, 표시, 직접 수정과 새 생성 시 초기화를 구현한다.
- [ ] 관련 테스트와 타입 검사를 실행한다.

### Task 3: 전체 검증

**Files:**
- Verify: `tests/club-activity-generator.test.tsx`
- Verify: project test suite

- [ ] 동아리 컴포넌트 테스트를 실행한다.
- [ ] 전체 타입 검사와 프로덕션 빌드를 실행한다.
- [ ] 재사용 가능한 상태 관리 교훈을 ce-compound 문서에 반영한다.