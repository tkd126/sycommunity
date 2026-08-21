---
title: 참고 문서와 영역별 평가 PDF를 동시에 추출해 분석 대기시간 줄이기
date: 2026-07-19
category: performance-issues
module: 교과 평어 문서 분석
problem_type: performance_issue
component: service_object
symptoms:
  - 여러 영역별 평가 PDF와 평가 계획 및 수행평가지를 함께 올리면 첨부 자료 분석 시간이 길어짐
root_cause: async_timing
resolution_type: code_fix
severity: medium
tags:
  - document-extraction
  - parallel-processing
  - report-generator
---

# 참고 문서와 영역별 평가 PDF를 동시에 추출해 분석 대기시간 줄이기

## Problem

교과 평어 작성기가 여러 영역별 평가 PDF와 평가 계획 및 수행평가지를 한 번에 받지만, 참고 문서 추출은 모든 영역 PDF 분석이 끝난 뒤 시작되어 전체 대기시간이 두 작업 묶음의 합에 가까워졌음.

## Symptoms

- 영역별 평가 PDF가 많을수록 평가 계획과 수행평가지 분석 시작도 함께 늦어짐.
- 화면에는 하나의 분석 작업으로 보이지만 서버 내부에서 독립적인 파일 읽기가 직렬 구간을 형성함.

## What Didn't Work

- 영역 PDF끼리만 `Promise.all`로 처리하는 것으로는 충분하지 않았음. 평가 계획과 수행평가지가 영역 분석 이후에 시작되므로 파일 종류 사이의 직렬 대기는 그대로 남았음.

## Solution

`app/api/parse-documents/route.ts`에서 평가 계획과 수행평가지의 텍스트 추출 프로미스를 영역 PDF 분석 전에 즉시 시작함. 학생 이름 제거에는 영역 PDF에서 추출한 명렬 정보가 필요하므로, 참고 문서 원문만 먼저 읽고 실제 익명화는 영역 분석이 끝난 뒤 수행함.

```ts
const evaluationPlanResultPromise = isUploadedFile(evaluationPlan)
  ? readFile(evaluationPlan)
      .then((text) => ({ text, error: null as unknown }))
      .catch((error: unknown) => ({ text: "", error }))
  : Promise.resolve({ text: "", error: null as unknown });

const analyzedAreas = await Promise.all(/* 영역 PDF 분석 */);

const result = await evaluationPlanResultPromise;
const evaluationPlanText = redactNames(result.text);
```

`tests/api/parse-documents.test.ts`에는 영역 PDF, 평가 계획, 수행평가지 추출이 같은 시점에 활성화되는지를 검사하는 회귀 테스트를 추가함.

## Why This Works

텍스트 추출은 서로 독립적이지만 익명화만 명렬 추출 결과에 의존함. 두 단계를 분리하면 개인정보 제거 순서를 유지하면서도 시간이 오래 걸리는 파일 읽기를 겹쳐 실행할 수 있어 전체 대기시간이 줄어듦.

## Prevention

- 여러 입력 파일을 처리할 때 파일 읽기와 후처리의 의존성을 구분하고, 독립적인 읽기 작업은 먼저 시작하는 테스트를 유지함.
- 이름 제거처럼 순서가 중요한 개인정보 처리 단계는 병렬화하지 않고, 원문을 응답이나 로그에 남기지 않음.

## Related Issues

- `docs/solutions/design-patterns/private-school-document-analysis-boundary.md`
- `docs/solutions/design-patterns/browser-only-evidence-upload-boundary.md`
