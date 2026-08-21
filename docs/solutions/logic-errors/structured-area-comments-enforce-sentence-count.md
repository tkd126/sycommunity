---
title: 교과 평어의 선택 영역 수와 문장 수를 구조적으로 일치시키기
date: 2026-07-19
category: logic-errors
module: 교과 평어 생성
problem_type: logic_error
component: assistant
symptoms:
  - 평어 반영 영역 수를 세 개로 선택해도 결과가 한두 문장으로 생성될 수 있음
  - 여러 영역의 평가 내용이 한 문장에 섞여 영역별 근거를 확인하기 어려움
root_cause: missing_validation
resolution_type: code_fix
severity: high
tags: [structured-output, area-selection, sentence-count, openai, validation]
---

# 교과 평어의 선택 영역 수와 문장 수를 구조적으로 일치시키기

## Problem

학생별 영역 선택은 정확히 이루어져도 모델 응답을 하나의 `comment` 문자열로만 받으면 반영 영역 수와 실제 문장 수가 일치하는지 서버가 확인할 수 없다. 프롬프트에만 의존하면 세 영역을 선택했는데 두 문장이 오거나 여러 영역이 한 문장에 합쳐진 결과가 사용자에게 표시될 수 있다.

## Symptoms

- 반영 영역 수가 세 개여도 종합의견이 한두 문장으로 생성됨
- 선택된 각 영역과 생성 문장의 대응 관계를 서버에서 검증할 수 없음
- `매우 잘함` 선택지가 좁은 열에서 잘려 단계 확인이 불편함

## What Didn't Work

- 평어 전체를 자유 형식 문자열로 받고 프롬프트에만 영역 수를 적는 방식은 결과 개수를 기계적으로 보장하지 못함.
- 반 전체 영역 균형을 성취 단계와 같은 우선순위로 다루면 낮은 단계가 높은 단계보다 먼저 선택될 위험이 있음.

## Solution

모델 응답을 학생별 `areaComments` 배열로 변경했다. 각 원소는 `areaName`과 해당 영역의 `comment` 한 문장을 가진다. 서버는 학생에게 전달한 영역 배열과 응답 배열의 길이 및 영역명 집합을 대조한 뒤 입력 영역 순서로 재정렬하여 기존 화면이 사용하는 `comment` 문자열로 결합한다.

입력 단계에서도 학생별 선택 영역 수가 `areaCount`와 정확히 같은지 OpenAI 호출 전에 검증한다. 해당 검증은 `lib/openai.ts:38`, 응답 배열 대조와 결합은 `lib/openai.ts:196-207`에 있다.

```ts
if (row.areaComments.length !== expectedAreaNames.length) {
  throw new Error("영역별 평어 수가 선택 영역 수와 일치하지 않습니다.");
}
const commentsByAreaName = new Map(row.areaComments.map((item) => [item.areaName, item.comment]));
if (commentsByAreaName.size !== expectedAreaNames.length
  || !expectedAreaNames.every((areaName) => commentsByAreaName.has(areaName))) {
  throw new Error("영역별 평어가 선택 영역과 일치하지 않습니다.");
}
```

프롬프트에도 영역 하나당 정확히 한 문장과 영역 간 문장 병합 금지를 명시했다. 모델이 한 영역에 여러 마침표를 반환하면 서버가 절을 쉼표로 연결하고 마지막 마침표 하나로 정규화한다. 화면에서는 영역 열을 넓히고 종합의견 최소 폭을 줄였다.

## Why This Works

문장 수가 자유 형식 텍스트의 해석 문제가 아니라 배열 길이 검증으로 바뀐다. 모델이 영역을 누락하거나 중복하면 서버가 결과를 거부하고, 순서만 다르면 안전하게 입력 순서로 복원한다. 표시용 성취 단계 문자열도 모델 응답을 신뢰하지 않고 서버 입력에서 다시 만들어 실제 선택과 일치한다.

영역 선택 알고리즘은 성취 단계 점수 차이를 먼저 비교하고, 점수가 같을 때만 반 전체 사용량을 비교한 뒤 지정 개수만 선택한다(`lib/area-selection.ts:46-54`). 따라서 영역 균형 때문에 낮은 단계가 높은 단계보다 먼저 선택되지 않는다.

## Prevention

- 생성형 모델이 개수, 순서, 대응 관계를 지켜야 하는 결과는 단일 문자열 대신 구조화 배열로 받는다.
- 모델 응답은 JSON 스키마 통과만으로 신뢰하지 않고 요청 입력과 서버에서 다시 대조한다.
- 반영 영역 수, 응답 배열 길이, 영역명 집합, 순서 재정렬, 원소별 문장 정규화를 각각 회귀 테스트로 고정한다.
- 화면 열 너비처럼 다시 줄어들기 쉬운 UI 값도 CSS 파일을 읽는 레이아웃 회귀 테스트로 보호한다.

## Related Issues

- 설계: `docs/superpowers/specs/2026-07-19-area-sentence-selection-design.md`
- 구현 계획: `docs/superpowers/plans/2026-07-19-area-sentence-selection.md`
