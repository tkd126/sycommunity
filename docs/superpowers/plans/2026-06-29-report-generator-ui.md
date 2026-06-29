# 교과 평어 작성기 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 파스텔 블루와 프리텐다드 타이포그래피를 적용한 교과 평어 작성기 화면에서 학생 행 편집, 더미 평어 생성, 복사, CSV 다운로드까지 동작하게 한다.

**Architecture:** App Router의 서버 페이지는 공통 셸과 클라이언트 생성기를 조합한다. 학생 상태와 더미 생성 규칙은 `lib/report-ui.ts`의 순수 함수로 분리해 Vitest로 검증하고, `ReportGenerator`는 브라우저 상태와 사용자 이벤트만 담당한다. API와 데이터베이스는 만들지 않는다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Pretendard, Vitest, Testing Library

---

## 파일 구조

- `package.json`: 실행, 빌드, 타입 검사, 테스트 명령과 의존성
- `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `next-env.d.ts`: 도구 설정
- `app/layout.tsx`: 전역 메타데이터와 글꼴 클래스
- `app/globals.css`: Tailwind 로드, 파스텔 색상 변수, 공통 입력과 버튼 스타일
- `app/page.tsx`: `AppShell` 안에 `ReportGenerator` 조합
- `components/AppShell.tsx`: 상단 메뉴와 전체 레이아웃
- `components/Sidebar.tsx`: 평가관리 트리 메뉴
- `components/UsageBadge.tsx`: 사용량 상태 표현
- `components/ReportGenerator.tsx`: 조회 조건, 참고자료, 학생 표, 도구 동작
- `lib/report-ui.ts`: 행 추가와 삭제, 생성 대상 결정, 더미 문장 생성, 복사 및 CSV 문자열 생성
- `types/report.ts`: 화면에서 공유하는 학생 행과 알림 타입
- `tests/report-ui.test.ts`: 순수 상태 로직 단위 테스트
- `tests/report-generator.test.tsx`: 화면의 생성 흐름과 입력 오류 테스트
- `test/setup.ts`: DOM 테스트 확장 설정

### Task 1: Next.js 기반과 시각 토큰 구성

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `test/setup.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: 패키지와 실행 명령 정의**

`package.json`에 `dev`, `build`, `start`, `typecheck`, `test`, `test:run` 명령을 두고 Next.js, React, Tailwind CSS, Pretendard, Vitest, jsdom, Testing Library를 추가한다. Next.js는 보안 수정이 포함된 16.1.6 이상, React는 19.2.4 이상을 사용한다.

- [ ] **Step 2: TypeScript와 빌드 설정 작성**

`tsconfig.json`은 strict 모드와 `@/*` 별칭을 사용한다. `postcss.config.mjs`는 `@tailwindcss/postcss`를 로드하고 `vitest.config.ts`는 jsdom, `test/setup.ts`, `@` 별칭을 설정한다.

- [ ] **Step 3: 전역 레이아웃 작성**

`app/layout.tsx`에서 `pretendard/dist/web/variable/pretendardvariable.css`와 `globals.css`를 가져오고 다음 메타데이터를 설정한다.

```tsx
export const metadata: Metadata = {
  title: "생기부 도우미",
  description: "교사를 위한 교과 평어 작성 업무 도구",
};
```

- [ ] **Step 4: 파스텔 블루 공통 스타일 작성**

`app/globals.css`에 Tailwind를 불러오고 `--color-brand: #79aee3`, `--color-brand-strong: #5f98d1`, `--color-brand-soft: #eaf4ff`, `--color-line: #d8e4f0`, `--color-canvas: #f6f9fc`를 정의한다. 본문 글꼴은 Pretendard 우선 순서로 지정하고 `.button-primary`, `.button-secondary`, `.field`, `.textarea` 공통 클래스를 만든다.

- [ ] **Step 5: 의존성 설치와 기반 검증**

Run: `pnpm install`

Run: `pnpm typecheck`

Expected: TypeScript 오류 없이 종료한다.

- [ ] **Step 6: 기반 커밋**

```powershell
git add package.json pnpm-lock.yaml tsconfig.json next-env.d.ts next.config.ts postcss.config.mjs vitest.config.ts test/setup.ts app/layout.tsx app/globals.css
git commit -m "build: initialize Next.js report helper"
```

### Task 2: 학생 상태와 내보내기 로직을 테스트 우선으로 구현

**Files:**
- Create: `types/report.ts`
- Create: `tests/report-ui.test.ts`
- Create: `lib/report-ui.ts`

- [ ] **Step 1: 공유 타입 작성**

```ts
export type StudentRow = {
  id: string;
  selected: boolean;
  number: number;
  name: string;
  reference: string;
  evaluation: string;
  comment: string;
};

export type Notice = { type: "success" | "error" | "info"; message: string } | null;
```

- [ ] **Step 2: 실패하는 순수 함수 테스트 작성**

`tests/report-ui.test.ts`에서 다음을 검증한다.

```ts
expect(getTargetIds(rows, "smart")).toEqual(["2"]);
expect(getTargetIds(rows.map(row => ({ ...row, selected: false })), "smart")).toEqual(["1", "2"]);
expect(addEmptyRow(rows).at(-1)?.number).toBe(3);
expect(removeSelectedRows(rows)).toHaveLength(1);
expect(applyDummyComments(rows, ["2"], "국어")[1].comment).toContain("국어");
expect(toCsv(rows)).toMatch(/^\uFEFF"번호","성명","평가결과","학기말 종합의견"/);
```

- [ ] **Step 3: 실패 확인**

Run: `pnpm test:run -- tests/report-ui.test.ts`

Expected: `lib/report-ui` 모듈이 없어 FAIL한다.

- [ ] **Step 4: 최소 구현 작성**

`lib/report-ui.ts`에 `INITIAL_ROWS`, `createInitialRows`, `getTargetIds`, `addEmptyRow`, `removeSelectedRows`, `applyDummyComments`, `toClipboardText`, `toCsv`를 구현한다. 더미 문장은 금지어 없이 긍정적인 한국어 문장 5개를 두고 학생 번호에 따라 순환 배정한다. 문자열 CSV 값은 큰따옴표를 두 개로 치환한 뒤 큰따옴표로 감싼다.

- [ ] **Step 5: 단위 테스트 통과 확인**

Run: `pnpm test:run -- tests/report-ui.test.ts`

Expected: 모든 테스트가 PASS한다.

- [ ] **Step 6: 로직 커밋**

```powershell
git add types/report.ts tests/report-ui.test.ts lib/report-ui.ts
git commit -m "feat: add report table state helpers"
```

### Task 3: 공통 업무 화면 셸 구현

**Files:**
- Create: `components/AppShell.tsx`
- Create: `components/Sidebar.tsx`
- Create: `components/UsageBadge.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: 사용량 배지 상태 테스트 작성**

`components/UsageBadge.tsx`가 `amountKrw`와 `budgetKrw`를 받아 27,000원 미만은 기본, 이상은 경고, 30,000원 이상은 제한 문구와 스타일을 반환하도록 먼저 `tests/usage-badge.test.tsx`를 작성한다.

```tsx
render(<UsageBadge amountKrw={30000} budgetKrw={30000} />);
expect(screen.getByText(/사용 제한/)).toBeInTheDocument();
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test:run -- tests/usage-badge.test.tsx`

Expected: 구성 요소가 없어 FAIL한다.

- [ ] **Step 3: 셸 구성 요소 구현**

`Sidebar`에는 학기말종합의견 아래 교과평어 작성기를 선택 상태로 표시한다. `AppShell`은 52픽셀 파스텔 블루 헤더, 232픽셀 흰색 사이드바, 유연한 메인 영역을 만든다. `UsageBadge`는 금액을 `ko-KR`로 표시하고 임계값 상태를 계산한다.

- [ ] **Step 4: 페이지 조합**

`app/page.tsx`에서 다음 구조를 반환한다.

```tsx
<AppShell>
  <ReportGenerator />
</AppShell>
```

`ReportGenerator`가 아직 없는 동안 최소 자리표시 구성 요소를 만들어 타입 검사 후 Task 4에서 완성한다.

- [ ] **Step 5: 셸 테스트와 타입 검사**

Run: `pnpm test:run -- tests/usage-badge.test.tsx`

Run: `pnpm typecheck`

Expected: 모두 PASS한다.

- [ ] **Step 6: 셸 커밋**

```powershell
git add components/AppShell.tsx components/Sidebar.tsx components/UsageBadge.tsx components/ReportGenerator.tsx app/page.tsx tests/usage-badge.test.tsx
git commit -m "feat: add pastel report workspace shell"
```

### Task 4: 교과 평어 작성기 상호작용 구현

**Files:**
- Create: `tests/report-generator.test.tsx`
- Modify: `components/ReportGenerator.tsx`

- [ ] **Step 1: 생성 흐름 실패 테스트 작성**

초기 화면에서 `평가 계획`, `교사 접근 비밀번호`를 입력하고 `전체 학생 생성`을 누르면 김하늘 행의 종합의견에 더미 문장이 들어가는지 검사한다. 비밀번호 없이 생성하면 `교사 접근 비밀번호를 입력해 주세요`가 표시되는지도 검사한다.

```tsx
fireEvent.change(screen.getByLabelText("평가 계획"), { target: { value: "읽기와 쓰기 평가 계획" } });
fireEvent.change(screen.getByLabelText("교사 접근 비밀번호"), { target: { value: "teacher" } });
fireEvent.click(screen.getByRole("button", { name: "전체 학생 생성" }));
expect(screen.getByLabelText("김하늘 학기말 종합의견")).not.toHaveValue("");
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test:run -- tests/report-generator.test.tsx`

Expected: 생성 흐름이 아직 없어 FAIL한다.

- [ ] **Step 3: 조회 조건과 참고자료 영역 구현**

학년도, 학기, 학년, 반, 교과 select와 조회 버튼을 만든다. `details`와 `summary`를 사용한 접이식 영역에 평가 계획, 예시문, 추가 지시사항, 비밀번호 입력을 배치한다. 입력 완료 수를 summary 오른쪽에 표시한다.

- [ ] **Step 4: 학생 표와 도구 버튼 구현**

학생 행을 `useState(createInitialRows)`로 관리한다. 체크박스, 번호, 성명, 자료 입력 버튼, 평가결과, 종합의견 textarea를 제어 입력으로 구현한다. `교과평어 생성`은 smart 대상, `선택 학생만 생성`은 selected 대상, `전체 학생 생성`은 all 대상을 사용한다.

- [ ] **Step 5: 검증과 편집 동작 구현**

교과, 대상 학생의 이름과 평가결과, 평가 계획 또는 예시문, 비밀번호를 순서대로 검사해 화면 안내를 표시한다. 행 추가, 선택 삭제, `window.confirm`을 거친 초기화, 참고자료 펼치기와 포커스 이동을 연결한다.

- [ ] **Step 6: 복사와 CSV 구현**

`navigator.clipboard.writeText(toClipboardText(rows))`로 복사하고 실패를 안내한다. CSV는 `Blob`, `URL.createObjectURL`, 임시 anchor를 사용해 `교과평어.csv`로 내려받고 마지막에 URL을 해제한다.

- [ ] **Step 7: 상호작용 테스트 통과 확인**

Run: `pnpm test:run -- tests/report-generator.test.tsx`

Run: `pnpm test:run`

Expected: 모든 테스트가 PASS한다.

- [ ] **Step 8: 기능 커밋**

```powershell
git add components/ReportGenerator.tsx tests/report-generator.test.tsx
git commit -m "feat: implement dummy report generation workflow"
```

### Task 5: 전체 품질과 브라우저 검증

**Files:**
- Create: `README.md`
- Modify: implementation files only when verification exposes a defect

- [ ] **Step 1: README 작성**

설치와 실행 명령, 1단계의 더미 생성 범위, 학생 데이터가 브라우저 메모리에만 있다는 점, OpenAI API와 데이터베이스는 아직 연결되지 않았다는 점을 기록한다.

- [ ] **Step 2: 정적 검증**

Run: `pnpm typecheck`

Run: `pnpm test:run`

Run: `pnpm build`

Expected: 세 명령 모두 오류 없이 종료한다.

- [ ] **Step 3: 개발 서버와 브라우저 검증**

Run: `pnpm dev`

브라우저에서 1440픽셀 너비로 열어 헤더, 사이드바, 조회 조건, 접이식 영역, 도구 버튼, 학생 5행이 겹치지 않는지 확인한다. 비밀번호 누락 안내, 전체 생성, 선택 생성, 직접 수정, 행 추가, 선택 삭제, 초기화를 수행하고 콘솔 오류가 없는지 확인한다.

- [ ] **Step 4: 접근성과 문구 확인**

모든 입력의 레이블, 키보드 포커스 표시, 버튼의 비활성 상태, 금지 표현 미사용, 특정 공공기관 사칭 문구 미사용을 확인한다.

- [ ] **Step 5: 최종 커밋**

```powershell
git add README.md app components lib tests types package.json pnpm-lock.yaml
git commit -m "docs: document report generator prototype"
```
