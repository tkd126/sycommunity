---
title: 학생별 맞춤법 검사 상태와 원문 변경 무효화
date: 2026-07-28
category: design-patterns
module: club-activity-generator
problem_type: design_pattern
component: frontend_stimulus
severity: medium
applies_when:
  - "여러 학생의 생성 문장을 행 단위로 맞춤법 검사할 때"
  - "검사 이후 사용자가 원문을 직접 수정하거나 다시 생성할 수 있을 때"
tags:
  - proofreading
  - row-status
  - state-invalidation
  - teacher-ui
---

# 학생별 맞춤법 검사 상태와 원문 변경 무효화

## Context

여러 학생의 문장을 한 번에 맞춤법 검사하면 전체 완료 안내만으로는 어느 행이 그대로 통과했고 어느 행이 수정되었는지 알기 어렵다. 또한 검사 이후 문장을 직접 고치거나 새로 생성했는데 기존 검사 상태가 남아 있으면, 현재 문장이 검사를 마친 것처럼 잘못 보일 수 있다.

## Guidance

검사 결과 상태를 행 데이터에 함께 둔다. `components/ClubActivityGenerator.tsx`의 각 행은 `proofreadStatus`를 `clean`, `corrected`, 또는 미검사 상태인 `undefined`로 관리한다.

- 교정 결과와 검사 전 문장이 같으면 `clean`으로 저장하고 `문제 없음`을 표시한다.
- 두 문장이 다르면 `corrected`로 저장하고 `수정됨`을 표시한다.
- 사용자가 결과 문장을 직접 수정하면 상태를 즉시 `undefined`로 되돌린다.
- 동아리 활동 기록을 다시 생성하거나 검사 전 문장을 복원해도 이전 검사 상태를 지운다.
- 학생 목록의 인원수를 바꿀 때는 유지되는 앞쪽 행의 입력값은 보존하되, 검사 백업은 지워 현재 목록과 과거 검사 결과가 섞이지 않게 한다.

상태 문구에는 `${번호}번 맞춤법 검사 상태` 형식의 접근성 이름을 부여한다. 이 계약은 `tests/club-activity-generator.test.tsx`에서 같은 문장과 수정된 문장을 각각 반환하는 회귀 테스트로 확인한다.

## Why This Matters

맞춤법 검사 상태는 문장 자체가 아니라 특정 시점의 문장에 대한 검증 결과다. 원문이 바뀐 뒤에도 상태가 남으면 실제 내용과 표시가 어긋난다. 행 단위 상태와 변경 시 무효화를 함께 적용하면 교사가 각 학생의 검사 결과를 바로 구분하면서도 오래된 상태를 신뢰하는 일을 막을 수 있다.

## When to Apply

- 표의 각 행에 별도 생성 문장과 검사 결과가 있을 때
- 검사 API가 수정된 문장만 반환하거나 원문과 동일한 문장을 반환할 때
- 사용자가 검사 뒤에 결과를 직접 수정할 수 있을 때

## Examples

```ts
const proofreadStatus =
  correctedRecord === row.record ? "clean" : "corrected";

updateRow(row.id, {
  record: event.target.value,
  proofreadStatus: undefined,
});
```

## Related

- `components/ClubActivityGenerator.tsx`
- `tests/club-activity-generator.test.tsx`
- `docs/superpowers/specs/2026-07-26-club-roster-proofread-status-design.md`
- `docs/superpowers/plans/2026-07-26-club-roster-proofread-status.md`
