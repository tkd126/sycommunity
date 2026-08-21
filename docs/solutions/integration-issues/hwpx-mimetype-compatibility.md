---
title: HWPX 다운로드 파일의 한컴오피스 호환 식별 형식
date: 2026-07-25
category: integration-issues
module: creative-activity-export
problem_type: integration_issue
component: service_object
symptoms:
  - 생성한 HWPX 파일을 한컴오피스 한글에서 정상적으로 열 수 없음
  - 예시 HWPX와 생성 HWPX의 내부 mimetype 값이 서로 다름
root_cause: wrong_api
resolution_type: code_fix
severity: high
tags:
  - hwpx
  - hancom-office
  - zip-mimetype
  - document-export
---

# HWPX 다운로드 파일의 한컴오피스 호환 식별 형식

## Problem

HTML을 HWPX로 변환한 결과는 내부 리더에서 정상적으로 읽혔지만, 실제 한컴오피스 한글에서는 파일을 열지 못하는 문제가 발생했다. 사용자가 제공한 정상 예시 파일과 생성 파일의 표 구조만 비교해서는 원인을 찾기 어려웠다.

## Symptoms

- 생성 파일은 ZIP 서명과 HWPX 구성 파일을 갖추고 있었다.
- 프로젝트의 HWPX 리더 테스트도 통과했다.
- 정상 예시의 첫 ZIP 항목은 `mimetype=application/hwp+zip`이었지만 변환 라이브러리 출력은 `mimetype=application/owpml`이었다.

## What Didn't Work

- ZIP 서명만 확인하는 테스트는 한컴오피스 호환성을 보장하지 못했다.
- 생성 파일을 동일 라이브러리로 다시 읽는 왕복 테스트만으로는 외부 프로그램과의 식별 형식 차이를 발견할 수 없었다.

## Solution

`htmlToHwpx`로 문서 본문과 표를 생성한 뒤 JSZip으로 패키지를 다시 열어 첫 항목의 `mimetype`을 정상 예시와 동일한 `application/hwp+zip`으로 교체했다. 이 항목은 압축하지 않는 `STORE` 방식으로 유지하고, 나머지 항목은 다시 ZIP으로 생성했다.

```ts
const source = await htmlToHwpx(html, metadata);
const zip = await JSZip.loadAsync(source);
zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });

return zip.generateAsync({
  type: "uint8array",
  compression: "DEFLATE",
  compressionOptions: { level: 6 },
  platform: "DOS",
});
```

회귀 테스트에서는 ZIP의 첫 로컬 파일 항목을 직접 읽어 이름이 `mimetype`인지, 내용이 `application/hwp+zip`인지 확인한다. 그 뒤 HWPX 리더로 표 머리글과 사용자가 수정한 최종 평어까지 다시 추출해 검증한다.

## Why This Works

HWPX는 ZIP 기반 문서이지만 ZIP이라는 사실만으로 호환성이 결정되지 않는다. 실제 문서를 여는 프로그램은 패키지 첫 항목의 식별 문자열과 저장 방식을 참고한다. 정상 예시와 동일한 식별 형식으로 재포장하면 라이브러리 내부 왕복 테스트와 실제 한컴오피스 호환 조건을 함께 만족시킬 수 있다.

## Prevention

- 외부 문서 형식은 생성 라이브러리의 자체 리더 테스트뿐 아니라 실제 정상 예시 파일의 패키지 구조와 비교한다.
- HWPX 테스트에서 ZIP 서명, 첫 `mimetype` 항목, 표 구조, 사용자 수정 내용 반영을 각각 확인한다.
- 내보내기 직전 화면 상태를 유일한 데이터 원본으로 사용해 수정한 평어가 다운로드 파일에도 반영되도록 한다.

## Related Issues

- `lib/creative-activity-export.ts`
- `tests/creative-activity-export.test.ts`
- `tests/creative-activity-generator.test.tsx`

## 2026-07-25 추가 확인: MIME 수정만으로는 충분하지 않음

후속 수동 확인에서 `mimetype`만 `application/hwp+zip`으로 바꾼 문서도 실제 한컴오피스에서 빈 문서처럼 보이거나 열기 동작이 불안정했다. 따라서 위 해결책의 “MIME 교체만으로 실제 호환 조건을 만족한다”는 결론은 불완전하다.

변환 라이브러리 출력과 정상 한컴 문서를 다시 비교한 결과 다음 구조 차이가 있었다.

- 라이브러리의 `version.xml`은 앱 네임스페이스를 사용하지만 정상 문서는 전용 버전 네임스페이스를 사용한다.
- 라이브러리 XML은 `hp:rowCnt`처럼 속성에도 접두사를 붙이지만 정상 문서는 `rowCnt`처럼 비접두사 속성을 사용한다.
- 라이브러리 본문에는 페이지 크기와 여백을 정의하는 문서 구역 정보가 없다.

현재 구현은 MIME 교체와 함께 다음 보정을 수행한다.

1. `version.xml`을 `http://www.hancom.co.kr/hwpml/2011/version` 네임스페이스로 작성함.
2. HWPX XML 속성 접두사를 정상 문서 형태로 정규화함.
3. `section0.xml`에 구역 정보가 없으면 가로 문서 크기와 여백을 추가함.
4. 화면에서 교사가 수정한 최종 평어를 동일하게 담은 DOCX 대체 다운로드를 제공함.

예방 규칙도 다음처럼 강화한다.

- 자체 리더 왕복 테스트만으로 외부 프로그램 호환성을 단정하지 않음.
- ZIP 식별자뿐 아니라 버전 네임스페이스, 속성 형식, 구역 정보, 사용자 수정 내용까지 회귀 테스트함.
- 실제 한컴오피스 수동 검증 전에는 “완전 호환”이라고 표현하지 않음.
- HWPX 호환 문제가 재발해도 결과를 받을 수 있도록 DOCX와 CSV 대체 경로를 유지함.
