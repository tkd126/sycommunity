---
title: 교과 평어 생성은 분석과 분리하고 최대 두 묶음으로 진행률을 전달하기
date: 2026-07-20
category: performance-issues
module: 교과 평어 생성
problem_type: performance_issue
component: service_object
symptoms:
  - 첨부 분석이 끝나 학생 목록이 보여도 생성 버튼이 오래 비활성화됨
  - 학급 전체 평어 생성이 오래 걸리고 완료 정도를 확인할 수 없음
  - 모델이 영역 순서나 문장부호를 조금 다르게 반환하면 전체 요청이 실패함
root_cause: async_timing
resolution_type: code_fix
severity: high
tags:
  - openai-responses-api
  - ndjson-stream
  - parallel-batches
  - report-generator
---

# 교과 평어 생성은 분석과 분리하고 최대 두 묶음으로 진행률을 전달하기

## Problem

첨부 자료 분석 함수가 학생 목록을 만든 직후 전체 평어 생성까지 기다렸다. 사용자는 표를 이미 볼 수 있었지만 같은 `isGenerating` 상태 때문에 생성 버튼이 약 20초 이상 비활성화되었다. 학급 전체를 한 번에 생성하면 첫 결과도 전체 응답이 끝날 때까지 표시할 수 없었고, 모델 출력의 사소한 순서 차이로 전체 결과가 502가 되기도 했다.

## Symptoms

- 분석 완료 뒤 사용자가 생성 버튼을 누르지 않았는데도 OpenAI 요청이 시작됨.
- 27명 생성 중 `0/27`과 `27/27` 사이의 실제 진행 상황을 알 수 없음.
- 모델이 동일한 영역을 다른 순서로 반환하거나 한 영역 문장 안에 마침표를 둘 이상 넣으면 모든 학생 결과가 거부됨.

## What Didn't Work

- 분석과 생성을 한 함수에서 연속 실행하면 사용자가 원하지 않은 API 비용이 발생하고 버튼 잠금 원인을 숨김.
- 27명을 27개 요청으로 나누면 분당 요청 제한, 입력 자료 반복 비용, 서버 부하가 커짐.
- 가짜 백분율은 문서 분석 API가 실제 학생 수를 반환하기 전에는 근거가 없어 사용하지 않음.

## Solution

`components/ReportGenerator.tsx`에서 첨부 분석 뒤의 자동 `generateFrom` 호출을 제거했다. 분석 중에는 파일 수와 경과 시간만 표시하고, 완료 뒤 학생 수와 영역 수를 표시한다. 분석이 끝나는 즉시 사용자가 생성 버튼을 누를 수 있다.

`lib/report-batches.ts`는 12명 이하는 한 묶음, 13명 이상은 최대 두 묶음으로 균등하게 나눈다. 27명은 14명과 13명이다. `app/api/generate-report/route.ts`는 두 묶음을 동시에 생성하고 각 성공 결과를 NDJSON 이벤트로 즉시 전달한다.

```ts
const batches = splitReportStudents(validated.data.students);
await Promise.all(batches.map(async (students) => {
  const generated = await generateReports({ ...validated.data, students }, creator, model);
  await saveUsageEvent(...);
  send({ type: "progress", completed, total, rows: generated.rows });
}));
```

브라우저는 `13/27명 48%`처럼 실제 완료 인원만 표시하고 먼저 도착한 학생 평어를 즉시 표와 세션 저장소에 반영한다. 한 묶음이 실패해도 다른 묶음의 성공 결과는 유지한다. 기존 JSON 응답도 테스트와 호환성을 위해 유지한다.

모델 응답 검증은 영역 개수와 이름 집합을 엄격히 확인하되 순서만 다르면 입력 순서로 재정렬한다. 영역 문장에 여러 마침표가 있으면 절을 쉼표로 연결해 마지막 마침표 하나인 문장으로 정규화한다. 누락, 추가, 중복 영역은 계속 실패시킨다.

## Why This Works

분석 요청의 수명과 유료 생성 요청의 수명이 분리되어 목록 표시와 생성 버튼 상태가 일치한다. 최대 두 묶음은 한 요청의 긴 꼬리 시간을 줄이면서도 27개 개별 요청보다 요청 제한과 반복 입력 비용을 통제한다. NDJSON은 서버가 실제로 완료한 묶음만 전달하므로 가짜 진행률이 아니다.

영역 검증은 의미적으로 중요한 집합과 개수에는 엄격하고 모델이 흔히 달리 출력하는 순서와 마침표에는 관대해져, 잘못된 결과를 허용하지 않으면서 불필요한 502를 줄인다.

## Prevention

- 파일 분석 같은 준비 단계에서 사용자의 명시적 동작 없이 유료 생성을 연쇄 호출하지 않는다.
- 긴 생성 작업은 요청 수를 무제한 늘리지 말고 비용과 속도 사이의 고정된 상한을 둔다.
- 진행률은 서버가 완료한 단위만 사용하고 분석 전 학생 수처럼 알 수 없는 값은 백분율로 만들지 않는다.
- 생성형 모델 검증은 의미적 불일치와 표현상의 차이를 구분해 테스트한다.
- 성공한 묶음의 사용량은 다른 묶음의 성공 여부와 관계없이 즉시 기록한다.

## Related Issues

- `docs/solutions/logic-errors/structured-area-comments-enforce-sentence-count.md`
- `docs/solutions/performance-issues/parallel-reference-document-extraction.md`
- `docs/superpowers/specs/2026-07-20-report-progress-reliability-design.md`
