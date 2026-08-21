---
title: 동아리 활동 기록은 사실 중심 문장 규칙을 순수 함수로 분리
date: 2026-07-09
category: design-patterns
module: club-activity
problem_type: design_pattern
component: client_ui
severity: medium
applies_when:
  - 동아리 활동 메모를 생활기록부용 활동 기록 문장으로 바꿀 때
  - 제품명이나 고유명사를 일반 표현으로 바꿔야 할 때
  - 일반적인 긍정 표현은 허용하되 과장·비교·낙인 표현은 줄여야 할 때
tags: [club-activity, privacy, wording-rules, noun-ending]
---

# 동아리 활동 기록은 사실 중심 문장 규칙을 순수 함수로 분리

## Context

동아리 활동 기록은 교과 평어와 다르게 평가 문장이 아니라 활동 사실 기록이다. 다만 교사의 실제 기록에서는 “성실하게”, “적극적으로” 같은 일반적인 긍정 표현은 쓰일 수 있다. 따라서 모든 정성 표현을 제거하기보다, 제품명과 고유명사는 일반 표현으로 바꾸고 “친구보다”, “완벽하게”, “최고의” 같은 과장·비교·낙인 표현만 별도 목록으로 순화한다.

## Guidance

동아리 기록 생성 규칙은 UI 컴포넌트 안에 직접 넣지 말고 `lib/club-record.ts` 같은 순수 함수로 분리한다.

- 제품명과 고유명사 치환은 `sanitizeClubActivityText`에서 처리한다.
- 민원 소지가 큰 과장·비교·낙인 표현도 `sanitizeClubActivityText`에서 처리한다.
- 활동 유형별 문장 생성은 `generateClubActivityRecord`에서 처리한다.
- 결과 문장은 `함.`, `제작함.`, `발표함.`처럼 명사형 종결어미로 끝낸다.
- 학생 실명은 저장하거나 생성 로직에 넣지 않고, 화면에는 `1번 학생` 같은 익명 이름만 사용한다.
- 학생마다 동아리가 다를 수 있으므로 별도 공통 동아리명/공통 키워드 영역보다 학생별 행의 “동아리 활동 내용” 입력칸을 우선한다.

## Why This Matters

문장 규칙을 순수 함수로 분리하면 나중에 OpenAI 생성 로직을 붙이더라도 사전·사후 점검 단계에서 같은 규칙을 재사용할 수 있다. UI 테스트와 별도로 문장 규칙만 빠르게 검증할 수 있어 제품명 노출, 과장 표현, 학생 비교 표현을 줄일 수 있다. 이번 수정에서 “정성 표현 전체 제거”는 실제 교사 기록 요구와 맞지 않을 수 있음을 확인했으므로, 다음 작업에서도 금지어 목록과 허용 표현 목록을 구분해야 한다.

## When to Apply

- 동아리활동, 진로활동, 행동특성처럼 활동 메모를 생활기록부 문장으로 다듬는 기능
- 입력값에 제품명, 연예인명, 서비스명이 들어올 가능성이 있는 기능
- 개인정보를 저장하지 않는 익명 화면 표시가 필요한 기능
- 학생마다 활동 소속이나 활동 내용이 달라 공통 설정보다 행별 입력이 더 자연스러운 기능

## Examples

```ts
generateClubActivityRecord("레고 블록을 활용해 경복궁을 만들었다.");
// "블록 모형을 활용하여 건축물을 완성하고 전시함."

generateClubActivityRecord("아이돌 노래에 맞추어 열심히 춤연습을 했다.");
// "대중가요에 맞추어 춤 동작을 연습하고 발표함."

sanitizeClubActivityText("성실하게 레고 작품을 만들었다");
// "성실하게 블록 모형 작품을 만들었다"

sanitizeClubActivityText("친구보다 뛰어나게 완벽하게 레고 작품을 만들었다");
// "블록 모형 작품을 만들었다"
```

## Related

- `lib/club-record.ts`
- `components/ClubActivityGenerator.tsx`
- `tests/club-record.test.ts`
- `tests/club-activity-generator.test.tsx`
