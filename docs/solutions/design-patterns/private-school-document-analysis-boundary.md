---
title: 학교 평가 문서 분석과 외부 생성 요청의 개인정보 경계
date: 2026-07-03
last_updated: 2026-07-04
category: design-patterns
module: report-generation
problem_type: design_pattern
component: tooling
severity: high
applies_when:
  - 학생 이름이 포함된 PDF, HWP, HWPX를 로컬 서버에서 분석할 때
  - 문서 분석 결과 일부만 외부 생성 API로 전송할 때
tags: [privacy, pdf-table, hwp, openai, data-minimization, student-record]
---

# 학교 평가 문서 분석과 외부 생성 요청의 개인정보 경계

## Context

영역별 평가결과 문서에는 학생 번호, 이름, 성취 단계가 함께 들어 있지만 외부 생성 API에는 학생 이름을 보내지 않아야 한다. 평가 계획과 수행평가지도 실제로 읽어야 하므로 파일 분석 자체를 생략할 수 없고, 로컬 분석과 외부 전송 사이에 명확한 축소 경계가 필요했다.

구현 중 PDF 텍스트 항목 하나를 한 줄로 취급한 초기 방식은 표의 셀을 각각 다른 행으로 분리해 학생 번호와 단계를 연결하지 못할 수 있었다. 또한 영역 결과에서 이름을 제거하는 것만으로는 평가 계획, 수행평가지, 예시문에 명렬표 이름이 섞인 경우를 막지 못했다.

## Guidance

문서 원본은 서버 요청 메모리에서만 읽고 파일 시스템이나 데이터베이스에 저장하지 않는다. 영역별 문서에서는 학생 번호와 정규화한 단계만 반환한다. 원래 성명은 분석 응답에도 포함하지 않고 브라우저에는 `1번 학생`처럼 번호 기반 익명값만 표시한다.

PDF 표는 텍스트 항목의 세로 좌표가 가까운 셀을 한 행으로 묶은 뒤 가로 좌표 순으로 정렬한다. 그 결과 `번호 이름 영역 단계`가 같은 줄이 되어 번호와 단계를 안정적으로 추출할 수 있다.

학교 업무 PDF는 화면은 가로 표지만 파일 자체에 90도 회전 정보가 들어 있을 수 있다. 이때 원본 텍스트 좌표를 바로 사용하면 학생 행이 아니라 열 전체가 한 줄로 합쳐진다. `page.getViewport()`의 변환 행렬을 각 텍스트 항목에 먼저 적용해 화면 기준 좌표로 바꾼 뒤 행을 묶어야 한다. 페이지 하단의 `1 / 6 학교명` 같은 문구는 학생 번호와 혼동되지 않도록 별도로 제외한다.

```ts
const sameLine = Math.abs(currentLine.y - item.transform[5]) <= 2;
line.items.sort((a, b) => a.transform[4] - b.transform[4]);
```

Next.js 서버 라우트에서 PDF 라이브러리가 번들 내부 실행에 실패할 수 있으므로 `pdfjs-dist`와 HWP 파서를 `serverExternalPackages`로 두고 Node 환경에서 직접 로드한다. 독립 실행 함수뿐 아니라 실제 `/api/parse-documents` 요청으로 같은 fixture를 검증해야 한다.

외부 생성 요청 직전에는 다음 정보만 구성한다.

- 학생 번호
- 교과 영역 이름
- 교사가 확인한 성취 단계
- 이름을 제거한 평가 계획, 수행평가지, 예시문, 추가 지시

여러 영역의 명렬표는 학생 번호로만 병합한다. 서버가 영역 PDF에서 일시적으로 확인한 성명 목록은 평가 계획과 수행평가지 텍스트를 익명화하는 데만 사용하고 응답 전에 폐기한다. 생성 요청 본문에 알려진 이름이 없는지 회귀 테스트로 고정한다. 데이터베이스에는 토큰 수, 비용, 모델, 생성 시각만 저장한다.

영역명은 평탄화된 행 문자열에서 추측하면 안 된다. 성취기준 문구의 `시간` 같은 단어가 영역명으로 오인될 수 있다. PDF 헤더의 `성명`, `영역`, `성취기준` 가로 좌표로 영역 열의 좌우 경계를 계산하고, 그 범위 안의 셀 값만 영역명 후보로 사용한다.

```ts
const [candidate = "", next = ""] = remainder.split(/\s+/);
const followsNameColumn = next === areaName || next.startsWith("[");
const name = followsNameColumn && /^[가-힣]{2,4}$/.test(candidate) ? candidate : "";
```

## Why This Matters

파일을 읽는 기능과 외부로 보내는 기능은 같은 개인정보 경계를 갖지 않는다. 로컬 서버가 원문을 일시적으로 읽더라도 외부 API와 영구 저장소에는 업무에 필요한 최소 정보만 전달해야 한다. PDF 좌표 기반 행 복원과 요청 직전 이름 제거를 함께 적용해야 분석 정확도와 개인정보 최소화를 동시에 유지할 수 있다.

## When to Apply

- 글자를 선택할 수 있는 학교 업무 PDF의 표를 파싱할 때
- 학생 자료에서 번호별 평가 단계만 외부 모델에 제공할 때
- 사용량 기록은 필요하지만 학생 원문과 생성 결과 저장은 금지할 때

## Examples

- 입력 문서 행: `1 김하늘 문학 매우잘함`
- 로컬 분석 결과: `roster: [{ studentNumber: 1 }]`, `areas: [{ areaName: "문법", students: [{ studentNumber: 1, level: "매우 잘함" }] }]`
- 외부 생성 입력: `학생 번호 1 | 문학: 매우 잘함`
- 사용량 저장: 입력 토큰, 출력 토큰, 원화 비용, 모델, 생성 시각
- 회전 PDF 검증: 6쪽 문서에서 1번부터 27번까지 중복 없이 추출되는지 확인
- 개인정보 경계 검증: 분석 응답과 OpenAI 생성 요청 모두에 원래 이름이 없는지 확인
- 익명 문서 검증: 실제 27명 PDF에서 학생 번호와 단계는 27개이고 로컬 명렬표의 비어 있지 않은 이름은 0개인지 확인

## Related

- `docs/solutions/design-patterns/browser-only-evidence-upload-boundary.md`
- `docs/superpowers/specs/2026-07-02-report-generation-design.md`
- `tests/document-extraction.test.ts`
- `tests/report-generator.test.tsx`
