---
title: GPT-5.6 Terra 기본 모델 전환 시 모델과 비용 설정을 함께 변경
date: 2026-08-21
category: tooling-decisions
module: OpenAI Responses API
problem_type: tooling_decision
component: api_layer
severity: high
applies_when:
  - OpenAI 기본 모델을 다른 가격 체계의 모델로 교체할 때
tags: [openai, responses-api, gpt-5-6-terra, usage-budget]
---

# GPT-5.6 Terra 기본 모델 전환 시 모델과 비용 설정을 함께 변경

## Context

생기부 도우미는 OpenAI 응답의 입력 토큰과 출력 토큰을 환경변수 단가에 곱해 월 사용액을 계산하고 한도를 차단한다. 따라서 모델 식별자만 바꾸면 화면의 사용량과 실제 API 비용이 달라질 수 있다.

## Guidance

기본 모델을 `gpt-5.6-terra`로 전환할 때 다음 항목을 하나의 변경 단위로 다룬다.

- 서버 설정, API 처리기, 생성 라이브러리의 기본 모델 식별자를 모두 바꾼다.
- `.env.example`과 로컬 `.env.local`의 모델 및 입력·출력 단가를 함께 바꾼다.
- 기존 비추론 모델의 지연 특성을 유지하려면 Responses API 요청에 `reasoning: { effort: "none" }`을 명시한다.
- 환경변수 기본값과 요청 본문을 검증하는 테스트를 갱신한다.
- `.env.local`은 계속 Git에서 제외하고 예시 파일만 저장소에 포함한다.

```dotenv
OPENAI_MODEL=gpt-5.6-terra
INPUT_PRICE_PER_1M_USD=2.00
OUTPUT_PRICE_PER_1M_USD=12.00
```

```ts
await creator.create({
  model,
  reasoning: { effort: "none" },
  input,
});
```

## Why This Matters

모델명, 요청 설정, 가격 설정이 서로 어긋나면 호출 실패, 불필요한 지연, 월 한도 계산 오류가 발생한다. 특히 코드의 월 예산 차단을 실제 비용 안전장치로 사용하므로 단가 동기화는 기능 정확성과 비용 보안에 직접 연결된다.

## When to Apply

- OpenAI 모델을 변경할 때
- OpenAI 공식 가격이 바뀔 때
- 추론 모델 도입 후 응답 속도나 사용량이 예상보다 증가할 때

## Examples

모델만 변경하지 말고 `OPENAI_MODEL`, `INPUT_PRICE_PER_1M_USD`, `OUTPUT_PRICE_PER_1M_USD`, Responses API 추론 설정, 관련 테스트를 같은 검토 목록에 둔다.

## Related

- `lib/server-config.ts`
- `lib/openai.ts`
- `lib/creative-activity-openai.ts`
- `lib/proofread.ts`
