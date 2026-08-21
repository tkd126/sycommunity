---
title: 창체 연간시간표 분석 범위를 줄이고 표준 형식은 로컬에서 처리하기
date: 2026-07-23
category: performance-issues
module: creative_activity_timetable_analysis
problem_type: performance_issue
component: service_object
symptoms:
  - 연간 HWP 시간표의 로컬 글자 추출은 빠르지만 활동 목록이 나타날 때까지 오래 기다려야 했음
  - 선택 학기만 남겨도 표준 시간표 전체를 외부 모델이 다시 구조화하는 시간이 남아 있었음
  - 날짜와 과목 약어가 일정한 학교 시간표도 비정형 문서와 같은 외부 분석 경로를 사용했음
root_cause: wrong_api
resolution_type: code_fix
severity: medium
related_components:
  - assistant
tags:
  - creative-activity
  - timetable-analysis
  - hwp
  - semester-filtering
  - local-parser
  - openai-fallback
  - fast-path
  - performance
---

# 창체 연간시간표 분석 범위를 줄이고 표준 형식은 로컬에서 처리하기

## Problem

창의적 체험활동 연간시간표에서 날짜와 활동을 추출하는 시간이 길었다. HWP 파일에는 이미 학기, 주차, 과목 약어, 날짜별 활동이 일정한 형태로 들어 있었지만, 문서의 글자를 꺼낸 뒤에도 전체 내용을 외부 모델에 보내 다시 활동 목록으로 구조화하고 있었다.

## Symptoms

- 연간시간표 한 파일을 분석한 뒤 활동 목록이 나타날 때까지 체감상 긴 대기 시간이 발생했음.
- 이번 작업에서 제공된 실제 HWP 파일의 로컬 글자 추출 측정값은 약 81밀리초였으므로 HWP 읽기 자체는 주된 병목이 아니었음.
- 선택 학기만 분석하도록 입력을 줄여도 외부 모델 호출과 긴 구조화 응답 생성은 그대로 남아 있었음.
- 정형화된 표준 시간표와 형식이 다른 문서가 같은 분석 경로를 사용했음.

## Root Cause

`app/api/creative-activities/parse/handler.ts`는 문서에서 글자를 추출하고 선택 학기 구간을 남긴 뒤에도 `parseCreativeActivities`를 호출했다. 표준 시간표의 결정적인 구조를 서버 코드로 읽을 수 있는데도 외부 모델에 다시 구조화를 맡긴 것이 실제 병목이었다.

표준 연간시간표에는 다음과 같은 반복 구조가 있었다.

- `2026학년도 1학기`와 같은 학기 표기
- `3. 2- 3. 6`과 같은 주차 날짜 범위
- `자`, `봉`, `진`, `창체`를 포함한 과목 약어 배열
- `3.3(화) 학교폭력예방교육`과 같은 날짜별 활동 메모

## What Didn't Work

- HWP 추출기만 더 빠르게 만드는 방법은 병목과 맞지 않았음. 실제 제공 파일은 로컬 글자 추출이 약 81밀리초에 끝났음.
- 선택 학기 구간만 모델에 보내는 개선은 입력량과 비용은 줄였지만 외부 호출 자체는 제거하지 못했음.
- 모든 문서를 정규식으로 강제 분석하는 방식은 사용하지 않았음. 표준 구조가 없는 문서를 억지로 해석하면 날짜와 구분을 잘못 연결할 수 있기 때문임.
- 입력 문자 감소율을 실제 응답 시간 감소율로 간주하지 않았음. 외부 모델 응답 시간은 출력 행 수와 외부 서비스 상태에도 영향을 받음.

## Solution

분석 흐름을 두 단계로 구성했다.

### 선택 학기로 입력 범위 축소

`lib/creative-activity.ts`의 `selectCreativeSemesterText`가 선택한 학기 표제부터 다음 학기 표제 직전까지만 남긴다. 표제를 찾지 못하면 전체 글자를 반환하여 형식이 다른 문서도 기존 분석 경로로 처리할 수 있게 한다.

```ts
const semesterText = selectCreativeSemesterText(extractedText, semesterValue);
const redaction = redactIdentityHeaders(semesterText);
const redactedText = redaction.text.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
```

이번 작업에서 제공된 4,997자 문서는 1학기 선택 시 2,731자로 약 45퍼센트, 2학기 선택 시 2,245자로 약 55퍼센트 줄었다. 이는 해당 파일의 모델 입력 범위 감소 수치이며 모든 파일이나 실제 처리 시간이 같은 비율로 줄어든다는 뜻은 아니다.

### 표준 시간표는 로컬에서 바로 분석

`lib/creative-activity.ts`에 `parseCreativeTimetableLocally`를 추가했다. 이 함수는 학기와 주차 구조가 확인되는 경우에만 다음 순서로 처리한다.

1. 각 주의 날짜 범위와 수업일 수를 확인함.
2. 요일별 과목 약어와 날짜별 활동 메모를 분리함.
3. 해당 날짜의 `자`, `봉`, `진`, `창체` 약어를 활동 구분으로 연결함.
4. 휴일과 휴업일을 제외하고 날짜, 구분, 활동, 시수를 정규화함.
5. 활동명에 동아리가 있으면 결과에서 제외함.
6. 표준 구조를 인식하지 못하거나 추출 결과가 없으면 `null`을 반환함.

API는 개인정보 헤더를 제거한 뒤 로컬 분석을 먼저 시도한다.

```ts
const localActivities = parseCreativeTimetableLocally(redactedText);
if (localActivities) {
  return NextResponse.json({
    activities: localActivities.map(/* 응답 재검사 및 정규화 */),
    warnings: [
      "표준 시간표 형식을 로컬에서 분석했습니다. 활동과 구분을 확인해 주세요.",
    ],
    usage: {
      amountKrw: monthlyCostKrw,
      budgetKrw: dependencies.config.monthlyBudgetKrw,
    },
  });
}

const parsed = await dependencies.parseCreativeActivities(redactedText, model);
```

로컬 분석에 성공하면 외부 모델 호출, 해당 요청의 비용 계산, 사용량 이벤트 저장을 실행하지 않는다. 표준 구조를 확실히 인식하지 못하면 기존 외부 모델 분석기로 되돌아가므로 HWP, HWPX, PDF의 비정형 문서 지원도 유지된다.

## Verification

- `tests/creative-activity.test.ts`에서 표준 주차 구조의 날짜와 자율 활동 연결, 동아리 제외, 비표준 입력의 `null` 반환을 확인함.
- `tests/api/creative-activities-parse.test.ts`에서 표준 시간표 처리 시 외부 모델 분석, 비용 계산, 사용량 저장이 호출되지 않는 것을 확인함.
- 이번 작업에서 제공된 실제 연간시간표의 로컬 분석 경로는 개발 환경에서 100밀리초 미만으로 완료되었고 동아리 활동을 결과에서 제외했음. 이는 해당 파일과 환경에서 얻은 관찰값이며 고정된 성능 보장이 아님.
- 관련 창체 테스트 120개, 전체 테스트 364개 중 363개가 한 번의 전체 실행에서 통과했음. 병렬 실행에서 시간 초과한 기존 교과평어 복사 테스트 한 개는 단독 실행에서 통과했음.
- 전체 TypeScript 검사와 Next.js 프로덕션 빌드가 통과했음.

## Why This Works

이미 정형화된 시간표는 서버 코드가 직접 해석하므로 외부 네트워크 왕복, 모델 대기, 긴 JSON 구조화 출력을 제거할 수 있다. 로컬 파서는 문자열 분리, 정규식 일치, 날짜 계산만 수행한다.

빠른 경로의 적용 조건은 보수적으로 유지했다. 학기 표기와 표준 표제 또는 주차 구조가 있을 때만 로컬 결과를 사용하고, 그렇지 않으면 기존 외부 분석기로 되돌아간다. 속도 개선 때문에 비정형 문서 지원이나 개인정보 제거 순서가 약해지지 않는다.

## Prevention

- 문서 처리 성능을 개선하기 전에 파일 추출, 전처리, 외부 호출, 후처리 시간을 따로 측정함.
- 반복되는 학교 행정 문서는 결정적 로컬 파서를 먼저 검토하고, 인식 실패 시에만 외부 모델을 사용하는 빠른 경로와 대체 경로를 구성함.
- 로컬 파서가 애매한 입력을 억지로 성공 처리하지 않도록 인식 조건과 `null` 대체 경로를 테스트함.
- 빠른 경로 테스트에서는 결과뿐 아니라 외부 모델 호출, 비용 계산, 사용량 저장이 생략되는지도 확인함.
- 실제 학교 문서의 측정 시간은 환경에 따른 관찰값으로 기록하고 일반적인 성능 보장으로 표현하지 않음.

## Related Issues

- [참고 문서 병렬 추출](./parallel-reference-document-extraction.md)
- [단일 요청 평어 생성 크기 조절](./single-request-report-generation-sizing.md)
- [학교 문서 개인정보 경계](../design-patterns/private-school-document-analysis-boundary.md)
- [창체 시간표 날짜 보존](../logic-errors/creative-timetable-date-preservation.md)
- [창체 생성 행 제한 일치](../logic-errors/creative-generation-client-server-row-limit.md)
