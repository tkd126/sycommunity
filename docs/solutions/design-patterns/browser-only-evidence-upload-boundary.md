---
title: 브라우저 전용 평가자료 등록 경계
date: 2026-06-30
category: design-patterns
module: report-generator-ui
problem_type: design_pattern
component: tooling
severity: medium
applies_when:
  - 민감한 학생 자료를 서버에 보내기 전 파일 등록 UI를 먼저 검증할 때
  - 파일 내용 분석 기능과 등록 상태 UI를 단계적으로 분리할 때
tags: [file-upload, privacy, react-state, validation, teacher-tool]
---

# 브라우저 전용 평가자료 등록 경계

## Context

교과 평어 작성기의 첫 단계에서는 영역별 평가결과 PDF와 참고 문서를 등록해야 하지만, 파일 본문 추출과 서버 전송은 아직 구현 범위가 아니었다. 화면이 파일을 분석한 것처럼 오해하게 만들지 않으면서도 필수 자료 누락을 막을 수 있는 명확한 경계가 필요했다.

## Guidance

파일은 브라우저의 `File` 객체로만 보관하고 등록 상태와 파일명, 크기, 허용 확장자만 확인한다. 영역별 평가결과는 영역명과 PDF를 필수 한 쌍으로 다루며, 평가 계획과 수행평가지는 별도의 권장·선택 자료로 구분한다.

순수 함수는 영역 행 수 조절과 파일 형식 표시를 담당하고 React 구성 요소는 사용자 상호작용과 생성 전 검증을 담당한다.

```ts
export type AreaEvidence = {
  id: string;
  name: string;
  file: File | null;
};

export function isPdfFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".pdf");
}
```

생성 전에는 화면에서 선택한 영역 수와 실제 영역 행 수가 일치하고 모든 행에 이름과 PDF가 있는지 검사한다. 파일 내용이 아직 분석되지 않는다는 안내를 화면과 README에 함께 둔다.

예시문 목록처럼 `as const`로 선언한 첫 값을 상태 초기값으로 사용할 때 TypeScript가 상태를 첫 문자열 리터럴로 좁힐 수 있다. 다른 예시문으로 바뀌는 상태는 `useState<string>(...)`처럼 의도를 명시해야 타입 검사를 통과한다.

## Why This Matters

학생 자료가 서버나 로그에 우발적으로 남는 것을 막고, 1단계 UI가 실제 분석 기능을 제공하는 것처럼 보이는 오해도 피한다. 순수 검증 함수와 화면 상태를 분리하면 이후 서버 추출 기능을 추가할 때 기존 표와 업로드 UI를 유지하면서 경계만 교체할 수 있다.

## When to Apply

- 개인정보가 포함된 문서의 업로드 흐름을 UI부터 단계적으로 만들 때
- 파일 파싱 정확도가 아직 검증되지 않았을 때
- 필수 자료와 선택 참고자료의 의미가 다른 업무 도구를 만들 때

## Examples

- 영역별 평가결과: PDF만 허용하고 영역마다 한 개를 필수 등록
- 평가 계획: HWP, HWPX, PDF 한 개를 권장 등록
- 수행평가지: HWP, HWPX, PDF 여러 개를 선택 등록
- 저장 위치: React 상태와 브라우저 메모리만 사용하며 새로고침 시 폐기

## Related

- `docs/superpowers/specs/2026-06-29-report-generator-ui-design.md`
- `docs/superpowers/plans/2026-06-30-area-evidence-uploads.md`
