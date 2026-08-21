# 교과 평어 진행률·속도·안정성 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자료 분석 직후 생성 버튼을 사용할 수 있게 하고, 많은 학생을 두 묶음으로 병렬 생성하면서 실제 완료 인원 진행률과 부분 결과를 표시하며, 사소한 모델 출력 차이로 인한 502 오류를 제거한다.

**Architecture:** 기존 JSON API는 유지하고 NDJSON을 요청한 브라우저에는 서버가 학생을 최대 두 묶음으로 나눠 병렬 생성한 뒤 묶음 완료 이벤트를 전송한다. 클라이언트는 스트림 이벤트를 읽어 표와 진행률을 갱신한다. OpenAI 결과는 영역명 집합으로 검증 후 입력 순서로 재정렬하고 여러 마침표는 한 문장으로 정제한다.

**Tech Stack:** Next.js App Router, React, TypeScript, OpenAI Responses API, Web Streams, Zod, Vitest

## Global Constraints

- 학생 이름과 평가 원문을 로그에 남기지 않는다.
- 인증, 승인 사용자, 교사 비밀번호, 월 예산과 IP 요청 제한을 유지한다.
- 성공한 OpenAI 호출의 사용량은 다른 묶음 실패 여부와 관계없이 저장한다.
- 반영 영역 수, 성취 단계 우선순위, 영역당 한 문장 규칙을 유지한다.
- 기존 작업트리의 관련 없는 변경을 되돌리지 않는다.

### Task 1: 분석과 자동 생성 분리 및 분석 수치 표시

**Files:**
- Modify: `tests/report-generator.test.tsx`
- Modify: `components/ReportGenerator.tsx`

- [ ] 자동 생성이 호출되지 않고 분석 후 생성 버튼이 활성화되는 실패 테스트를 작성한다.
- [ ] 분석 중 `파일 N개 · 경과 M초`, 완료 후 `학생 N명·영역 N개`가 표시되는 실패 테스트를 작성한다.
- [ ] 기존 `analyzeDocuments`의 `await generateFrom(...)` 분기를 제거한다.
- [ ] 분석 경과 시간 상태와 타이머를 추가하고 실제 파일 수를 표시한다.
- [ ] `pnpm test:run tests/report-generator.test.tsx --pool=threads --maxWorkers=1`로 통과를 확인한다.

### Task 2: 영역 결과 재정렬·문장 정제·출력 상한

**Files:**
- Modify: `tests/api/generate-report.test.ts`
- Modify: `lib/openai.ts`
- Modify: `lib/prompt.ts`
- Modify: `tests/prompt.test.ts`

- [ ] 영역 순서만 다른 응답을 성공시키는 실패 테스트를 작성한다.
- [ ] 여러 마침표를 쉼표 절과 마지막 마침표 하나로 정제하는 실패 테스트를 작성한다.
- [ ] 출력 상한이 학생 수 × 영역 수를 반영하는 실패 테스트를 작성한다.
- [ ] 영역명 중복·누락은 계속 거부하는 테스트를 유지한다.
- [ ] 영역 결과를 이름으로 매핑해 입력 순서로 결합한다.
- [ ] 문장 정제와 새 토큰 상한을 구현하고 간결한 문장 지시를 추가한다.
- [ ] API 및 프롬프트 테스트를 실행한다.

### Task 3: 최대 두 묶음 병렬 생성과 NDJSON 진행 이벤트

**Files:**
- Modify: `tests/api/generate-report.test.ts`
- Modify: `app/api/generate-report/route.ts`
- Create: `lib/report-batches.ts`
- Create: `tests/report-batches.test.ts`

- [ ] 12명 이하 한 묶음, 27명은 14명·13명으로 분리하는 실패 테스트를 작성한다.
- [ ] NDJSON 요청에 `progress`, `complete` 이벤트가 반환되는 실패 테스트를 작성한다.
- [ ] 먼저 끝난 묶음의 행과 실제 완료 인원이 먼저 전달되는 테스트를 작성한다.
- [ ] 두 호출을 동시에 시작하되 성공한 각 묶음 사용량을 즉시 저장하는 테스트를 작성한다.
- [ ] 기존 JSON 요청은 기존 응답 계약을 유지한다.
- [ ] 스트림 내부 오류는 안전한 오류 코드로 변환하고 원문·평어를 로그에 기록하지 않는다.
- [ ] 배치 및 API 테스트를 실행한다.

### Task 4: 클라이언트 스트림 처리와 진행률 UI

**Files:**
- Modify: `tests/report-generator.test.tsx`
- Modify: `components/ReportGenerator.tsx`
- Modify: `app/globals.css`

- [ ] `13/27명 48%`, `27/27명 100%` 이벤트별 부분 반영 실패 테스트를 작성한다.
- [ ] 스트림 읽기 유틸리티와 부분 행 병합을 구현한다.
- [ ] 진행 막대와 경과 시간을 표시한다.
- [ ] 생성 중 세 생성 버튼을 모두 비활성화한다.
- [ ] 일부 묶음 실패 시 완료된 평어를 유지하고 남은 학생 수를 안내한다.
- [ ] 화면 테스트를 실행한다.

### Task 5: 회귀 검증과 문서화

**Files:**
- Create: `docs/solutions/performance-issues/batched-report-progress-stream.md`

- [ ] 관련 테스트를 단일 작업자로 전체 실행한다.
- [ ] 전체 테스트를 실행해 기존 창체 CSV Blob 실패와 신규 회귀를 구분한다.
- [ ] 타입 검사를 실행해 기존 라우트·창체 오류와 신규 오류를 구분한다.
- [ ] 실제 익명 합성 데이터로 한 번 생성해 스트리밍 결과와 완료 수치를 확인한다.
- [ ] ce-compound 경량 모드로 원인과 재사용 교훈을 문서화한다.
