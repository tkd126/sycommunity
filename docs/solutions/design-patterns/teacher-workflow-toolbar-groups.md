---
title: 교사 업무 표의 선택 생성 결과 버튼 그룹 패턴
date: 2026-07-26
last_updated: 2026-07-26
category: design-patterns
module: report-toolbars
problem_type: design_pattern
component: frontend_stimulus
severity: medium
applies_when:
  - 한 표에서 선택 생성 복사 다운로드 삭제 동작을 함께 제공할 때
  - 생성 버튼과 범위 선택 버튼이 섞여 사용자가 작업 순서를 혼동할 때
  - 생성 결과에 맞춤법 검사와 되돌리기를 제공할 때
tags:
  - toolbar
  - workflow
  - teacher-ui
  - header-checkbox
  - proofreading
---

# 교사 업무 표의 선택 생성 결과 버튼 그룹 패턴

## Context

교과평어, 동아리활동, 창체활동 표의 도구 버튼을 한 줄에 모두 나열하면 전체 선택과 생성 범위 선택의 의미가 섞인다. 별도의 `전체 선택` 버튼은 표의 체크박스와 떨어져 있어 현재 선택 상태를 파악하기 어렵고, 생성 버튼과 비슷한 문구 때문에 오조작 가능성도 생긴다.

## Guidance

전체 선택과 해제는 별도 도구 버튼으로 만들지 않는다. 표 머리글의 `선택` 바로 옆에 체크박스를 두고, 해제·부분 선택·전체 선택 상태를 같은 위치에서 표현한다. 공통 컴포넌트 `components/HeaderSelectionCheckbox.tsx`가 전체 행 수와 선택 행 수를 받아 `checked`와 `indeterminate` 상태를 결정한다.

도구 모음은 다음 두 흐름만 시각적으로 구분한다.

1. `생성`: 사용자가 가장 먼저 실행할 기본 생성 동작과 정말 필요한 범위 생성 동작
2. `결과 관리`: 맞춤법 검사, 검사 전 복원, 복사, 다운로드, 행 추가, 선택 삭제, 초기화

동아리 화면처럼 기본 생성 동작이 선택 행이 있으면 선택 행을, 없으면 전체 행을 처리할 수 있다면 `선택 학생만 생성`과 `전체 학생 생성`을 따로 두지 않는다. 하나의 `동아리 활동 기록 생성` 버튼으로 범위를 자동 결정해 선택지를 줄인다. 창체 화면에서도 별도의 검토 관리 버튼 없이 사용자가 표의 날짜·구분·활동을 직접 수정하고 생성한다.

각 묶음에는 `role="group"`과 한국어 `aria-label`을 부여한다. 생성 묶음은 주 버튼 스타일로 강조하고, 결과 묶음은 보조 버튼으로 표시한다. 화면이 좁아질 때는 그룹 단위로 줄을 바꾸되 표 머리글 체크박스와 열 순서는 유지한다.

맞춤법 검사는 생성 결과 문자열만 서버로 보내며, 원래 결과를 화면 상태에 임시 백업하여 `검사 전으로 되돌리기`를 제공한다. 새 결과 생성이나 화면 초기화 시에는 이전 백업을 반드시 비워 오래된 결과가 복원되지 않게 한다.

## Why This Matters

`전체 선택`과 `전체 학생 생성`은 문구가 비슷하지만 각각 선택 상태 변경과 생성 실행이라는 전혀 다른 동작이다. 선택 상태를 체크박스가 있는 표 머리글에 모으고, 생성과 결과 처리를 별도 그룹으로 나누면 작업 순서와 버튼의 영향 범위를 빠르게 이해할 수 있다.

맞춤법 검사 백업도 생성 결과의 수명과 함께 관리해야 한다. 새 생성 이후 예전 백업이 남으면 되돌리기 버튼이 현재 결과가 아닌 과거 결과를 덮어쓸 수 있으므로, 생성·초기화 경계에서 함께 초기화한다.

## When to Apply

- 체크박스가 있는 업무용 표 위에 여러 일괄 작업을 제공할 때
- 생성이나 저장처럼 비용 또는 상태 변경이 큰 동작을 강조해야 할 때
- 하나의 스마트 생성 버튼으로 선택 범위를 안전하게 결정할 수 있을 때
- 생성 결과에 서버 기반 맞춤법 검사와 되돌리기를 추가할 때

## Examples

관련 구현과 검증 위치는 다음과 같다.

- `components/HeaderSelectionCheckbox.tsx`
- `components/ReportGenerator.tsx`
- `components/ClubActivityGenerator.tsx`
- `components/CreativeActivityGenerator.tsx`
- `lib/proofread-client.ts`
- `app/api/proofread/handler.ts`
- `app/globals.css`
- `tests/proofreading-ui.test.tsx`
- `tests/club-activity-generator.test.tsx`
- `tests/creative-activity-generator.test.tsx`
- `tests/report-generator.test.tsx`

접근성 이름이나 화면 제목을 바꾸면 해당 이름으로 요소를 찾는 테스트도 함께 갱신한다. 이때 테스트 실패는 기능 회귀가 아니라 UI 계약 변경일 수 있으므로, 렌더링된 접근성 트리에서 새 이름을 확인한 뒤 기대값을 수정한다.

## Related

- `docs/superpowers/specs/2026-07-26-selection-proofreading-ui-design.md`
- `docs/superpowers/plans/2026-07-26-selection-proofreading-ui.md`