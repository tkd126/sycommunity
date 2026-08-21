---
title: 성취 우선순위를 보존하는 반 전체 영역 균형 선택
date: 2026-07-04
category: design-patterns
module: report-generation
problem_type: design_pattern
component: service_object
severity: high
applies_when:
  - 학생별 평가 영역 중 일부만 학기말 종합의견에 반영할 때
  - 높은 성취 수준을 우선하면서 반 전체 영역 조합의 반복을 줄여야 할 때
tags: [achievement-level, balanced-selection, report-generation, deterministic-algorithm]
---

# 성취 우선순위를 보존하는 반 전체 영역 균형 선택

## Context

학생마다 네 개 이상의 평가 영역이 있지만 평어에는 그중 일부만 반영할 수 있다. 단순히 영역 순서대로 자르면 모든 학생에게 1·2영역만 반복되고, 전체 사용 횟수만 균등하게 만들면 매우 잘함 대신 낮은 단계를 선택하는 역전이 생길 수 있다.

## Guidance

선택 기준을 하나의 가중치로 섞지 않고 두 단계의 사전식 우선순위로 처리한다.

1. 매우 잘함, 잘함, 보통, 노력 요함 순으로 단계 점수를 먼저 비교한다.
2. 단계 점수가 같은 후보끼리만 현재까지 반 전체에서 선택된 영역 사용 횟수를 비교한다.
3. 사용 횟수까지 같으면 학생 번호 기반 순환 순서와 원래 영역 순서로 결정한다.

```ts
const LEVEL_SCORE = {
  "매우 잘함": 4,
  "잘함": 3,
  "보통": 2,
  "노력 요함": 1,
};

candidates.sort((a, b) =>
  LEVEL_SCORE[b.level] - LEVEL_SCORE[a.level]
  || usage(a.areaName) - usage(b.areaName)
  || cyclicOrder(a, studentNumber) - cyclicOrder(b, studentNumber),
);
```

학생 번호순으로 처리하고 선택 직후 영역 사용 횟수를 갱신하면 같은 수준의 후보가 많은 경우 `1·4`, `2·3`, `1·3`처럼 조합이 분산된다. 같은 입력에 같은 결과가 나오도록 난수는 사용하지 않는다.

## Why This Matters

성취 수준은 평어 근거의 교육적 우선순위이고, 영역 분포는 같은 우선순위 안에서 적용하는 다양성 기준이다. 두 기준의 순서를 분리해야 균형 때문에 강점이 누락되는 일을 막을 수 있다.

## When to Apply

- 업로드한 평가 영역 수보다 평어 반영 영역 수가 적을 때
- 여러 학생에게 동일한 상위 단계 영역이 존재할 때
- 결과의 재현성과 근거 설명이 필요할 때

## Examples

- 매우 잘함 2개와 잘함 2개 중 2개 선택: 항상 매우 잘함 2개 선택
- 매우 잘함 4개 중 2개 선택: 반 전체 사용 횟수가 적은 영역 조합 선택
- 모든 동점 조건이 같음: 학생 번호에 따른 순환 순서로 결정

## Related

- `lib/area-selection.ts`
- `tests/area-selection.test.ts`
- `docs/solutions/design-patterns/private-school-document-analysis-boundary.md`
