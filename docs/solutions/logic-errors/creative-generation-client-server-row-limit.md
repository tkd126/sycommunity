---
title: 창체 평어 전체 생성이 필수 입력값 오류로 거절되는 문제
date: 2026-07-22
category: logic-errors
module: creative-activity
problem_type: logic_error
component: frontend_stimulus
symptoms:
  - 확인 완료된 창체 활동 전체를 생성하면 필수 입력값을 확인하라는 오류가 표시됨
  - 50개 이하에서는 생성되지만 연간시간표에서 82개를 추출하면 생성 요청이 거절됨
root_cause: missing_validation
resolution_type: code_fix
severity: high
tags:
  - creative-activity
  - request-batching
  - row-limit
  - error-message
---

# 창체 평어 전체 생성이 필수 입력값 오류로 거절되는 문제

## Problem

교사가 날짜, 시수, 구분, 활동을 모두 확인했는데도 82개 활동의 전체 평어 생성 요청이 `필수 입력값을 확인해 주세요.`라는 문구와 함께 거절되었다. 실제 원인은 입력 누락이 아니라 API가 한 요청에 허용하는 행 수 50개를 화면이 초과한 것이었다.

## Symptoms

- 모든 행이 확인 완료 상태인데도 전체 생성이 즉시 실패함.
- 화면의 행 수가 50개를 넘을 때만 재현됨.
- 서버는 Zod 검증 실패를 모두 같은 입력 누락 문구로 반환하여 개수 제한을 알 수 없었음.

## What Didn't Work

- 화면의 모든 행을 한 번에 전송하는 방식은 API의 50개 제한과 호환되지 않음.
- 서버의 일반적인 `INVALID_BODY` 안내만으로는 사용자가 어느 값을 더 입력해야 하는지 잘못 추측하게 됨.
- 제한 자체를 없애는 방법은 요청 크기, 출력 토큰, 비용을 한 번에 키우므로 선택하지 않음.

## Solution

1. 클라이언트와 서버가 공유하는 1회 최대 생성 행 수를 50으로 정의한다 (`types/creative-activity.ts:2`).
2. 화면은 전체 행을 50개씩 나누어 순차 요청하고, 모든 묶음이 성공한 뒤에만 결과를 표에 반영한다 (`components/CreativeActivityGenerator.tsx:225`).
3. 각 묶음이 끝날 때 `완료 수/전체 수`와 백분율을 표시한다 (`components/CreativeActivityGenerator.tsx:246`).
4. 서버는 50개 초과 요청을 일반 입력 오류보다 먼저 판별해 `TOO_MANY_ROWS`와 정확한 안내를 반환한다 (`app/api/creative-activities/generate/route.ts:177`).

## Why This Works

82개 활동은 50개와 32개 두 요청으로 처리되므로 각 요청이 서버의 안전 제한을 지킨다. 결과를 임시 지도에 모은 뒤 모든 대상의 평어가 존재하는지 확인하고 한 번에 적용하므로, 두 번째 요청이 실패할 때 첫 번째 묶음만 화면에 반영되는 부분 성공도 방지한다.

## Prevention

- API의 건수 제한은 클라이언트와 서버가 같은 상수를 사용하도록 한다.
- 제한보다 한 개 많은 51개 행이 50개와 1개로 분리되는 컴포넌트 회귀 테스트를 유지한다 (`tests/creative-activity-generator.test.tsx:213`).
- 서버가 개수 초과를 입력 누락으로 표시하지 않는지 API 테스트로 검증한다 (`tests/api/creative-activities-generate.test.ts:188`).
- 안전 제한을 늘리기보다 클라이언트 분할과 전체 성공 후 반영 방식을 우선한다.

## Related Issues

- 없음.
