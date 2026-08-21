---
title: 창체 시간표 날짜가 확인 필요로 바뀌는 문제
date: 2026-07-22
category: logic-errors
module: creative-activity
problem_type: logic_error
component: service_object
symptoms:
  - 창체 활동명은 추출되지만 날짜 열이 모두 확인 필요로 표시됨
  - 연간시간표에 날짜가 있어도 날짜와 활동의 연결이 모델 응답에서 사라짐
root_cause: logic_error
resolution_type: code_fix
severity: high
tags:
  - creative-activity
  - hwp
  - date-normalization
  - structured-output
---

# 창체 시간표 날짜가 확인 필요로 바뀌는 문제

## Problem

연간시간표 HWP에서 창체 활동명은 정상적으로 읽혔지만, 결과 표의 날짜가 모두 `확인 필요`로 표시되었다. 원문에는 `3.3(화) 시업식`, `3.4(수) 학교폭력예방교육`처럼 날짜와 활동이 같은 줄에 있었다.

## Symptoms

- 활동명과 구분은 추출되지만 날짜가 유지되지 않음.
- `3. 4.(수)`, `2026.3.4`, `2026년 3월 4일` 같은 실제 문서의 날짜 표기를 기존 정규화기가 받아들이지 못함.
- API 응답 단계에 별도의 엄격한 날짜 검사가 있어 한 번 추출한 날짜도 다시 `확인 필요`로 바뀔 수 있었음.

## What Didn't Work

- 모델에게 원문 전체를 그대로 보내고 날짜와 활동을 연결하라고만 지시하는 방식은 표가 텍스트로 풀릴 때 생기는 연결의 모호성을 제거하지 못함.
- `M/D` 형태만 사후 검증하는 방식은 HWP 원문의 요일·연도·공백이 포함된 표기를 처리하지 못함.

## Solution

1. 하나의 공유 함수가 연도, 한글 월·일, 점·슬래시·하이픈, 요일과 공백을 포함한 날짜를 `M/D`로 정규화한다 (`lib/creative-activity.ts:42`).
2. 모델 호출 전에 원문의 같은 줄에 있는 날짜와 활동을 `[확정 날짜 M/D] 활동명`으로 주석 처리한다 (`lib/creative-activity.ts:58`, `lib/creative-activity.ts:68`).
3. 프롬프트가 확정 날짜를 그대로 사용하고 날짜 자리에 설명 문구를 넣지 않도록 명시한다 (`lib/creative-activity-openai.ts:167`, `lib/creative-activity-openai.ts:172`).
4. API 응답도 중복 정규식 대신 같은 공유 정규화기를 사용한다 (`app/api/creative-activities/parse/route.ts:285`).
5. 교사는 유효한 행을 `선택 항목 확인` 또는 `전체 항목 확인`으로 일괄 확정할 수 있고, 값이 잘못된 행은 확인 필요 상태로 남긴다 (`components/CreativeActivityGenerator.tsx:141`, `components/CreativeActivityGenerator.tsx:329`).

## Why This Works

HWP에서 텍스트를 읽은 직후 원문에 존재하던 날짜와 활동의 같은 줄 관계를 결정적으로 표시하므로 모델이 이를 다시 추론할 필요가 없다. 입력 전처리, 모델 응답 검증, API 반환이 동일한 날짜 정규화 규칙을 사용하므로 처리 단계마다 허용 형식이 달라지는 문제도 사라진다.

## Prevention

- 문서 파서가 읽는 실제 날짜 변형을 표 기반 테스트로 유지한다 (`tests/creative-activity.test.ts:34`).
- 모델 입력에는 확정 날짜 주석이 포함되고 설명 문구가 날짜에 쓰이지 않는지 검증한다 (`tests/creative-activity-openai.test.ts:97`).
- 일괄 확인은 유효한 행만 확정하고 잘못된 행을 남기는지 컴포넌트 테스트로 검증한다 (`tests/creative-activity-generator.test.tsx:170`).
- 같은 개념의 검증 정규식을 API 라우트에 다시 만들지 말고 공유 정규화기를 사용한다.

## Related Issues

- 없음.
