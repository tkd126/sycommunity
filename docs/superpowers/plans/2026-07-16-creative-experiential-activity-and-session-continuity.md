# 창의적 체험활동 평어와 세션 연속성 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 동아리 기록을 더 충실한 한 문장으로 만들고, 공통 평가 계획과 작업 상태를 현재 브라우저 탭에서 이어가며, 연간시간표에서 창체·자율·봉사·진로 활동을 추출해 `날짜 | 평어` 결과를 생성한다.

**Architecture:** 브라우저에는 버전이 있는 `sessionStorage` 어댑터를 두어 익명 작업 상태와 추출된 공통 평가 계획 텍스트만 저장한다. 시간표 원본은 서버에서 일시적으로 텍스트로 읽고 OpenAI Responses API의 JSON 스키마 출력으로 구조화한 뒤 폐기하며, 교사 확인을 거친 행만 별도 생성 API로 보낸다. 두 창체 API는 기존 인증, 교사 비밀번호, 요청 제한, 월 예산, 사용량 저장 경계를 재사용한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zod, OpenAI Responses API, Vitest, Testing Library, Prisma/PostgreSQL, HWP/HWPX/PDF 추출기

## Global Constraints

- 기존 작업 트리는 변경 파일이 많으므로 각 작업에서 명시한 파일만 수정하고 다른 변경을 되돌리지 않는다.
- 원본 HWP/HWPX/PDF 바이트, 시간표 전체 추출 텍스트, 학생 실명, Google 이메일, 생성 결과를 데이터베이스나 로그에 저장하지 않는다.
- 브라우저 저장은 `localStorage`가 아닌 현재 탭 전용 `sessionStorage`만 사용한다.
- 공통 평가 계획에는 파일명, 추출 텍스트, 분석 시각, 버전만 저장한다. 수행평가지·평가 기준안·학생 성적 파일은 저장하지 않는다.
- 창체 추출 대상은 `창체`, `자율`, `봉사`, `진로`, `자`, `봉`, `진`이고 `동`, `동아리`, `동아리활동`은 제외한다.
- 같은 날짜의 여러 활동은 서로 다른 행과 서로 다른 평어로 유지한다.
- 창체 평어와 동아리 기록은 한 문장, 명사형 종결, 한국어 중심으로 작성하며 제품명과 불필요한 고유 명사는 일반 표현으로 바꾼다.
- 최종 창체 결과 표에는 `날짜`, `평어` 두 열만 표시한다.
- 모든 생성·분석 API는 로그인한 활성 사용자만 호출 가능하며 기존 교사 접근 비밀번호, 월 예산, IP 요청 제한, 토큰 제한, 사용량 저장을 적용한다.

---

## 파일 구조와 책임

- `lib/session-storage.ts`: 버전 검증, JSON 파싱 실패 격리, SSR 안전 읽기·쓰기·삭제.
- `lib/club-record.ts`: 동아리 입력 일반화와 70~110자 한 문장 생성 규칙.
- `components/ClubActivityGenerator.tsx`: 동아리 행 편집과 세션 복원·저장·초기화.
- `types/documents.ts`: 공통 평가 계획 세션 타입을 포함한 문서 분석 타입.
- `components/ReportGenerator.tsx`: 공통 평가 계획 업로드·분석·복원과 과목별 민감 파일 분리.
- `types/creative-activity.ts`: 창체 분석 행, 검토 행, 생성 요청·응답 타입.
- `lib/creative-activity.ts`: 구분·날짜 정규화, 제외 행 필터, 중복 제거, 평어 후처리.
- `lib/creative-activity-openai.ts`: Responses API JSON 스키마와 분석·생성 프롬프트/파싱.
- `app/api/creative-activities/parse/route.ts`: 파일 검증·텍스트 추출·구조화 분석·비용 기록.
- `app/api/creative-activities/generate/route.ts`: 확인된 활동의 평어 생성·비용 기록.
- `components/CreativeActivityGenerator.tsx`: 파일 분석, 추출 행 검토, 생성, 복사, CSV, 최종 2열 표.
- `components/AppShell.tsx`, `components/Sidebar.tsx`, `app/page.tsx`: 새 상단 메뉴와 화면 연결.
- `app/globals.css`: 창체 검토표와 넓은 평어 결과표의 업무용 반응형 스타일.

---

### Task 1: 버전이 있는 세션 저장 어댑터

**Files:**
- Create: `lib/session-storage.ts`
- Create: `tests/session-storage.test.ts`

**Interfaces:**
- Produces: `readSessionValue<T>(key, version, validate)`, `writeSessionValue<T>(key, version, value)`, `removeSessionValue(key)`.
- Consumes: 브라우저의 `sessionStorage`; 서버 렌더링에서는 아무 동작도 하지 않음.

- [ ] **Step 1: 손상 데이터와 버전 불일치를 제거하는 실패 테스트 작성**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { readSessionValue, removeSessionValue, writeSessionValue } from "@/lib/session-storage";

describe("session storage adapter", () => {
  beforeEach(() => sessionStorage.clear());

  it("같은 버전의 검증된 값만 복원한다", () => {
    writeSessionValue("club", 1, { rows: 3 });
    expect(readSessionValue("club", 1, (value): value is { rows: number } =>
      typeof value === "object" && value !== null && typeof (value as { rows?: unknown }).rows === "number",
    )).toEqual({ rows: 3 });
  });

  it("손상되거나 버전이 다른 값은 해당 키만 삭제한다", () => {
    sessionStorage.setItem("bad", "{broken");
    expect(readSessionValue("bad", 1, (): never => { throw new Error("검증 호출 금지"); })).toBeNull();
    writeSessionValue("old", 1, { rows: 1 });
    expect(readSessionValue("old", 2, (): boolean => true)).toBeNull();
    expect(sessionStorage.getItem("bad")).toBeNull();
    expect(sessionStorage.getItem("old")).toBeNull();
  });

  it("지정한 키만 삭제한다", () => {
    writeSessionValue("club", 1, { rows: 1 });
    writeSessionValue("plan", 1, { text: "계획" });
    removeSessionValue("club");
    expect(sessionStorage.getItem("club")).toBeNull();
    expect(sessionStorage.getItem("plan")).not.toBeNull();
  });
});
```

- [ ] **Step 2: 테스트가 모듈 부재로 실패하는지 확인**

Run: `pnpm test:run tests/session-storage.test.ts`

Expected: FAIL with `Failed to resolve import "@/lib/session-storage"`.

- [ ] **Step 3: 최소 세션 저장 구현 작성**

```ts
type SessionEnvelope<T> = { version: number; value: T };

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export function writeSessionValue<T>(key: string, version: number, value: T): void {
  storage()?.setItem(key, JSON.stringify({ version, value } satisfies SessionEnvelope<T>));
}

export function readSessionValue<T>(
  key: string,
  version: number,
  validate: (value: unknown) => value is T,
): T | null {
  const target = storage();
  if (!target) return null;
  try {
    const parsed = JSON.parse(target.getItem(key) ?? "null") as Partial<SessionEnvelope<unknown>> | null;
    if (!parsed || parsed.version !== version || !validate(parsed.value)) {
      target.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    target.removeItem(key);
    return null;
  }
}

export function removeSessionValue(key: string): void {
  storage()?.removeItem(key);
}
```

- [ ] **Step 4: 집중 테스트 통과 확인**

Run: `pnpm test:run tests/session-storage.test.ts`

Expected: 3 tests PASS.

- [ ] **Step 5: 변경 파일만 커밋**

```bash
git add lib/session-storage.ts tests/session-storage.test.ts
git commit -m "feat: add safe tab-scoped session storage"
```

---

### Task 2: 동아리 기록 길이와 세션 연속성

**Files:**
- Modify: `lib/club-record.ts`
- Modify: `components/ClubActivityGenerator.tsx`
- Modify: `tests/club-record.test.ts`
- Modify: `tests/club-activity-generator.test.tsx`

**Interfaces:**
- Consumes: Task 1의 세션 어댑터.
- Produces: `ClubSessionState = { rows: ClubRow[] }`, 키 `student-record-helper:club:v1`, 70~110자 목표의 한 문장 기록.

- [ ] **Step 1: 길이·한 문장·복원·초기화 실패 테스트 추가**

```ts
it("활동 사실과 꾸준한 참여를 담은 한 문장을 만든다", () => {
  const record = generateClubActivityRecord("레고 블록을 활용해 경복궁을 만들었다.");
  expect(record.length).toBeGreaterThanOrEqual(70);
  expect(record).toMatch(/블록 모형/);
  expect(record).toMatch(/건축물/);
  expect(record).toMatch(/꾸준|성실|끈기|노력/);
  expect(record.match(/[.!?]/g)).toHaveLength(1);
  expect(record).toMatch(/함\.$/);
});
```

```tsx
it("동아리 입력과 결과를 같은 탭에서 복원하고 초기화 시 삭제한다", async () => {
  const user = userEvent.setup();
  const first = render(<ClubActivityGenerator />);
  await user.type(screen.getByLabelText("1번 동아리 활동 내용"), "레고 경복궁");
  await user.click(screen.getByRole("button", { name: "동아리 활동 기록 생성" }));
  first.unmount();

  render(<ClubActivityGenerator />);
  expect(screen.getByLabelText("1번 동아리 활동 내용")).toHaveValue("레고 경복궁");
  expect((screen.getByLabelText("1번 동아리 활동 기록") as HTMLTextAreaElement).value).toContain("꾸준");
  await user.click(screen.getByRole("button", { name: "초기화" }));
  expect(sessionStorage.getItem("student-record-helper:club:v1")).toBeNull();
});
```

- [ ] **Step 2: 기존 짧은 결과와 세션 미구현으로 실패하는지 확인**

Run: `pnpm test:run tests/club-record.test.ts tests/club-activity-generator.test.tsx`

Expected: FAIL on minimum length and restored input assertions.

- [ ] **Step 3: 활동별 문장을 한 문장으로 확장**

각 기존 분기 반환값을 다음 형식으로 바꾸고, 공통 후반부는 입력 키워드에 따라 하나만 선택한다.

```ts
function participationClause(text: string) {
  if (hasAny(text, ["끈기", "끝까지", "완성"])) return "제작 과정을 끝까지 이어 가며 끈기 있게 세부 표현을 다듬어 결과물을 완성함";
  if (hasAny(text, ["매 시간", "꾸준", "성실", "열심"])) return "매 시간 꾸준히 참여하며 완성도를 높이기 위해 성실하게 노력함";
  return "활동 과정에 꾸준히 참여하고 세부 표현을 다듬으며 결과물을 끝까지 완성함";
}

function oneSentence(activity: string, attitude: string) {
  return `${activity.replace(/[.!?]+$/u, "")} ${attitude.replace(/[.!?]+$/u, "")}.`;
}
```

활동 분기는 다음 결과 형태를 만들고, 최종 `sanitizeClubActivityText` 후 문장부호를 하나만 남긴다.

```ts
return oneSentence(
  "블록 모형을 활용하여 건축물의 형태와 구조를 살려 결과물을 제작하고 전시하며",
  participationClause(sanitized),
);
```

- [ ] **Step 4: 컴포넌트에 초기 복원과 변경 저장을 연결**

```tsx
const CLUB_SESSION_KEY = "student-record-helper:club:v1";
const CLUB_SESSION_VERSION = 1;

function isClubSessionState(value: unknown): value is { rows: ClubRow[] } {
  if (!value || typeof value !== "object" || !Array.isArray((value as { rows?: unknown }).rows)) return false;
  return (value as { rows: unknown[] }).rows.every((row) => {
    if (!row || typeof row !== "object") return false;
    const item = row as Partial<ClubRow>;
    return typeof item.id === "string" && typeof item.number === "number" &&
      typeof item.anonymousName === "string" && typeof item.activityMemo === "string" &&
      typeof item.record === "string" && typeof item.selected === "boolean";
  });
}

const [rows, setRows] = useState<ClubRow[]>(() =>
  readSessionValue(CLUB_SESSION_KEY, CLUB_SESSION_VERSION, isClubSessionState)?.rows ?? createRows(),
);

useEffect(() => {
  writeSessionValue(CLUB_SESSION_KEY, CLUB_SESSION_VERSION, { rows });
}, [rows]);
```

`resetRows`에는 `removeSessionValue(CLUB_SESSION_KEY)`를 추가한 뒤 새 행 상태를 설정한다. 저장 타입에는 익명 번호, 메모, 결과, 선택 상태만 포함하고 이메일·실명·파일은 포함하지 않는다.

- [ ] **Step 5: 집중 테스트와 타입 검사**

Run: `pnpm test:run tests/club-record.test.ts tests/club-activity-generator.test.tsx && pnpm typecheck`

Expected: all focused tests PASS, TypeScript exits 0.

- [ ] **Step 6: 변경 파일만 커밋**

```bash
git add lib/club-record.ts components/ClubActivityGenerator.tsx tests/club-record.test.ts tests/club-activity-generator.test.tsx
git commit -m "feat: preserve and enrich club activity records"
```

---

### Task 3: 모든 과목이 공유하는 평가 계획 세션

**Files:**
- Modify: `types/documents.ts`
- Modify: `components/ReportGenerator.tsx`
- Modify: `tests/report-generator.test.tsx`

**Interfaces:**
- Consumes: Task 1 세션 어댑터와 기존 `/api/parse-documents`의 `evaluationPlanText`.
- Produces: `SharedEvaluationPlan = { fileName: string; extractedText: string; analyzedAt: string }`, 키 `student-record-helper:evaluation-plan:v1`.

- [ ] **Step 1: 공통 계획 복원과 민감 파일 비저장 실패 테스트 작성**

```tsx
it("분석한 전체 평가 계획을 과목 전환과 재마운트 뒤 공통 사용한다", async () => {
  const user = userEvent.setup();
  const first = render(<ReportGenerator />);
  const plan = new File(["plan"], "1학기 전체 평가 계획.hwp", { type: "application/octet-stream" });
  await user.upload(screen.getByLabelText("평가 계획 파일"), plan);
  await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));
  await screen.findByText(/전체 평가 계획을 분석했습니다/);
  await user.click(screen.getByRole("tab", { name: "사회" }));
  expect(screen.getByText("1학기 전체 평가 계획.hwp")).toBeInTheDocument();
  first.unmount();

  render(<ReportGenerator />);
  expect(screen.getByText("1학기 전체 평가 계획.hwp")).toBeInTheDocument();
  const stored = sessionStorage.getItem("student-record-helper:evaluation-plan:v1") ?? "";
  expect(stored).toContain("익명 평가 계획");
  expect(stored).not.toContain("result.pdf");
  expect(stored).not.toContain("worksheet.hwp");
});
```

- [ ] **Step 2: 현재 과목별 File 상태 때문에 실패하는지 확인**

Run: `pnpm test:run tests/report-generator.test.tsx`

Expected: FAIL because the plan name disappears after subject change/remount.

- [ ] **Step 3: 공통 계획 타입과 검증 함수 추가**

```ts
export type SharedEvaluationPlan = {
  fileName: string;
  extractedText: string;
  analyzedAt: string;
};
```

`ReportGenerator.tsx`에 다음 검증과 상태를 둔다.

```tsx
const EVALUATION_PLAN_SESSION_KEY = "student-record-helper:evaluation-plan:v1";
const EVALUATION_PLAN_SESSION_VERSION = 1;

function isSharedEvaluationPlan(value: unknown): value is SharedEvaluationPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<SharedEvaluationPlan>;
  return typeof plan.fileName === "string" && plan.fileName.length <= 255 &&
    typeof plan.extractedText === "string" && plan.extractedText.length <= 30_000 &&
    typeof plan.analyzedAt === "string";
}

const [pendingEvaluationPlan, setPendingEvaluationPlan] = useState<File | null>(null);
const [sharedEvaluationPlan, setSharedEvaluationPlan] = useState<SharedEvaluationPlan | null>(() =>
  readSessionValue(EVALUATION_PLAN_SESSION_KEY, EVALUATION_PLAN_SESSION_VERSION, isSharedEvaluationPlan),
);
```

- [ ] **Step 4: 분석 요청과 생성 요청을 공통 계획으로 연결**

`acceptPlan`은 파일을 `pendingEvaluationPlan`에만 두고, `analyzeDocuments`가 성공하면 다음 상태만 저장한다.

```tsx
const nextPlan = pendingEvaluationPlan && analysis.evaluationPlanText
  ? {
      fileName: pendingEvaluationPlan.name,
      extractedText: analysis.evaluationPlanText,
      analyzedAt: new Date().toISOString(),
    }
  : sharedEvaluationPlan;

if (nextPlan) {
  setSharedEvaluationPlan(nextPlan);
  writeSessionValue(EVALUATION_PLAN_SESSION_KEY, EVALUATION_PLAN_SESSION_VERSION, nextPlan);
}
```

생성 요청에는 과목별 `analysis.evaluationPlanText` 대신 `sharedEvaluationPlan?.extractedText ?? analysis.evaluationPlanText`를 넣는다. 과목별 workspace에서 `evaluationPlan: File | null`을 제거하고, 수행평가지·평가 결과는 기존 메모리 상태에만 유지한다.

- [ ] **Step 5: 안내 문구와 교체/삭제 동작 정리**

평가 계획 카드 안내를 다음 문구로 바꾼다.

```tsx
<p>한 학기 전체 평가 계획을 올려 주세요. 한 번 분석하면 현재 브라우저 탭의 모든 과목에서 공통으로 사용됩니다.</p>
```

새 파일 분석은 기존 공통 계획을 교체한다. 평가 계획 삭제 버튼은 `pendingEvaluationPlan`만 지우고, 별도 `공통 계획 지우기` 버튼은 세션 키와 추출 텍스트를 함께 지운다.

- [ ] **Step 6: 집중 테스트와 개인정보 저장 문자열 검사**

Run: `pnpm test:run tests/report-generator.test.tsx && rg -n "localStorage|worksheetText|studentName|Google" components/ReportGenerator.tsx lib/session-storage.ts`

Expected: test PASS; `localStorage` 없음; 세션 저장 객체에 worksheet/student/email 필드 없음.

- [ ] **Step 7: 변경 파일만 커밋**

```bash
git add types/documents.ts components/ReportGenerator.tsx tests/report-generator.test.tsx
git commit -m "feat: reuse evaluation plan within browser tab"
```

---

### Task 4: 창체 도메인 정규화와 결과 후처리

**Files:**
- Create: `types/creative-activity.ts`
- Create: `lib/creative-activity.ts`
- Create: `tests/creative-activity.test.ts`

**Interfaces:**
- Produces: `CreativeActivityRow`, `CreativeActivityResult`, `normalizeCreativeCategory`, `normalizeCreativeDate`, `normalizeCreativeActivities`, `sanitizeCreativeComment`.
- Consumes: AI가 반환한 미신뢰 행 배열.

- [ ] **Step 1: 약어·동아리 제외·복수 활동·날짜 정렬 테스트 작성**

```ts
import { describe, expect, it } from "vitest";
import { normalizeCreativeActivities, sanitizeCreativeComment } from "@/lib/creative-activity";

describe("creative activity normalization", () => {
  it("자 봉 진을 정규화하고 동아리를 제외한다", () => {
    const rows = normalizeCreativeActivities([
      { date: "04.07", category: "자", activity: "다문화 교육", hours: 1, needsReview: false },
      { date: "4/7", category: "진", activity: "진로 탐색", hours: 1, needsReview: false },
      { date: "4/8", category: "동", activity: "동아리 활동", hours: 2, needsReview: false },
      { date: "3월 4일", category: "봉", activity: "교내 환경 정리", hours: 1, needsReview: false },
    ]);
    expect(rows.map(({ date, category, activity }) => ({ date, category, activity }))).toEqual([
      { date: "3/4", category: "봉사", activity: "교내 환경 정리" },
      { date: "4/7", category: "자율", activity: "다문화 교육" },
      { date: "4/7", category: "진로", activity: "진로 탐색" },
    ]);
  });

  it("같은 날짜라도 서로 다른 활동은 별도 행으로 유지한다", () => {
    const rows = normalizeCreativeActivities([
      { date: "4/7", category: "자율", activity: "안전 교육", hours: 1, needsReview: false },
      { date: "4/7", category: "봉사", activity: "환경 정리", hours: 1, needsReview: false },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].id).not.toBe(rows[1].id);
  });

  it("평어를 한국어 명사형 한 문장으로 정리한다", () => {
    expect(sanitizeCreativeComment("다문화교육을 통해 diversity를 이해했습니다!"))
      .toBe("다문화 교육을 통해 다양성을 이해함.");
  });
});
```

- [ ] **Step 2: 새 모듈 부재로 실패 확인**

Run: `pnpm test:run tests/creative-activity.test.ts`

Expected: FAIL resolving `@/lib/creative-activity`.

- [ ] **Step 3: 타입과 정규화 구현**

```ts
export const CREATIVE_CATEGORIES = ["창체", "자율", "봉사", "진로"] as const;
export type CreativeCategory = (typeof CREATIVE_CATEGORIES)[number];

export type CreativeActivityRow = {
  id: string;
  selected: boolean;
  date: string;
  category: CreativeCategory;
  activity: string;
  hours: number;
  needsReview: boolean;
  comment: string;
};

export type CreativeActivityResult = { id: string; date: string; comment: string };
```

```ts
const CATEGORY_MAP: Record<string, CreativeCategory | "exclude"> = {
  창체: "창체", 자율: "자율", 자: "자율", 봉사: "봉사", 봉: "봉사",
  진로: "진로", 진: "진로", 동: "exclude", 동아리: "exclude", 동아리활동: "exclude",
};

export function normalizeCreativeDate(value: string): string | null {
  const match = value.match(/(?:^|\s)(\d{1,2})\s*(?:월|[./-])\s*(\d{1,2})\s*(?:일)?/u);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${month}/${day}`;
}
```

`normalizeCreativeActivities`는 구분과 날짜를 정규화하고 빈 활동/제외 구분을 제거하며 `date|category|activity|hours`가 완전히 같은 행만 중복 제거한다. `needsReview`는 원본 표시, 날짜 실패, `hours`가 1~8 범위를 벗어날 때 참으로 둔다. 정렬은 월, 일, 원래 순서 순으로 한다.

- [ ] **Step 4: 평어 후처리 구현**

```ts
export function sanitizeCreativeComment(value: string): string {
  const koreanized = value
    .replace(/diversity/gi, "다양성")
    .replace(/LEGO/gi, "블록 모형")
    .replace(/레고/gu, "블록 모형")
    .replace(/[A-Za-z]+/g, "")
    .replace(/했습니다|하였다|했음/gu, "함")
    .replace(/[!?]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${koreanized.replace(/[.]+$/u, "")}.`;
}
```

- [ ] **Step 5: 집중 테스트 통과 확인**

Run: `pnpm test:run tests/creative-activity.test.ts`

Expected: all tests PASS.

- [ ] **Step 6: 변경 파일만 커밋**

```bash
git add types/creative-activity.ts lib/creative-activity.ts tests/creative-activity.test.ts
git commit -m "feat: normalize creative activity schedule rows"
```

---

### Task 5: 시간표 구조화 OpenAI 계층

**Files:**
- Create: `lib/creative-activity-openai.ts`
- Create: `tests/creative-activity-openai.test.ts`

**Interfaces:**
- Consumes: 기존 `ResponseCreator`, 전체 시간표 추출 텍스트.
- Produces: `parseCreativeActivities(text, creator, model)`, `generateCreativeComments(rows, creator, model)`과 토큰 사용량.

- [ ] **Step 1: 시간표 문맥 결합과 JSON 안전성 실패 테스트 작성**

```ts
it("주별 약어와 비고의 날짜를 함께 해석하도록 요청한다", async () => {
  const create = vi.fn().mockResolvedValue({
    output_text: JSON.stringify({ activities: [
      { date: "3/4", category: "자", activity: "학교폭력 예방 교육", hours: 1, needsReview: false },
      { date: "3/4", category: "동", activity: "동아리", hours: 1, needsReview: false },
    ], warnings: [] }),
    usage: { input_tokens: 200, output_tokens: 80 },
  });
  const result = await parseCreativeActivities("1주 수 자 동 / 비고 3.4(수) 학교폭력예방교육", { create });
  expect(create).toHaveBeenCalledWith(expect.objectContaining({
    max_output_tokens: 3000,
    text: { format: expect.objectContaining({ type: "json_schema", strict: true }) },
  }));
  expect(result.activities).toHaveLength(1);
  expect(result.activities[0]).toMatchObject({ date: "3/4", category: "자율" });
});

it("JSON이 아니거나 토큰 사용량이 없으면 실패한다", async () => {
  await expect(parseCreativeActivities("시간표", {
    create: vi.fn().mockResolvedValue({ output_text: "not json", usage: null }),
  })).rejects.toThrow();
});
```

- [ ] **Step 2: 모듈 부재 실패 확인**

Run: `pnpm test:run tests/creative-activity-openai.test.ts`

Expected: FAIL resolving the module.

- [ ] **Step 3: 분석 스키마와 프롬프트 구현**

Zod와 Responses API JSON schema 모두 다음 필드를 엄격히 정의한다.

```ts
const rawActivitySchema = z.object({
  date: z.string().max(20),
  category: z.string().max(20),
  activity: z.string().min(1).max(200),
  hours: z.number().int().min(0).max(20),
  needsReview: z.boolean(),
}).strict();
```

프롬프트에는 다음 원칙을 명시한다.

```ts
const prompt = `다음은 한 학기 연간시간표에서 추출한 텍스트이다.
주별 시간표 칸의 창체 약어와 오른쪽 비고란의 날짜 및 활동명을 함께 연결하라.
자=자율, 봉=봉사, 진=진로로 해석하고 동·동아리·동아리활동은 제외하라.
같은 날짜의 서로 다른 활동은 별도 행으로 유지하라.
날짜, 시수, 활동의 연결이 불확실하면 추측하지 말고 needsReview를 true로 표시하라.
학교명, 학급명, 교사명은 결과에 포함하지 마라.

[시간표 추출 텍스트]
${text}`;
```

응답을 JSON.parse와 Zod로 검증한 뒤 `normalizeCreativeActivities`를 적용하고 토큰 사용량을 반환한다.

- [ ] **Step 4: 생성 스키마와 프롬프트 구현**

생성 입력은 `id`, `date`, `category`, `activity`, `hours`만 받는다. 출력은 `rows: [{ id, comment }]`이며 요청 id 집합과 응답 id 집합이 정확히 같은지 검사한다.

```ts
const prompt = `교사가 확인한 창의적 체험활동마다 한 문장의 평어를 작성하라.
활동에서 알게 된 점, 실천 의지, 참여 태도 중 알맞은 내용을 포함하되 원문에 없는 사실은 만들지 마라.
한국어 중심으로 쓰고 제품명과 불필요한 고유 명사는 일반 표현으로 바꾸며 명사형 종결어미로 끝내라.
같은 날짜의 여러 활동도 각 id별 별도 문장으로 작성하라.
${JSON.stringify(rows)}`;
```

최종 comment는 `sanitizeCreativeComment`를 거친다.

- [ ] **Step 5: 집중 테스트 통과 확인**

Run: `pnpm test:run tests/creative-activity-openai.test.ts`

Expected: prompt, schema, invalid JSON, id matching tests PASS.

- [ ] **Step 6: 변경 파일만 커밋**

```bash
git add lib/creative-activity-openai.ts tests/creative-activity-openai.test.ts
git commit -m "feat: structure and generate creative activity records"
```

---

### Task 6: 창체 시간표 분석 API

**Files:**
- Create: `app/api/creative-activities/parse/route.ts`
- Create: `tests/api/creative-activities-parse.test.ts`

**Interfaces:**
- Consumes: multipart `file`, `password`; `extractDocumentText`, Task 5 `parseCreativeActivities`.
- Produces: `{ activities, warnings, usage }`; 원문/전체 텍스트는 반환하거나 저장하지 않음.

- [ ] **Step 1: 인증·파일·예산·성공 응답 테스트 작성**

```ts
it("활성 사용자만 지원 파일을 분석하고 원문 없이 결과를 반환한다", async () => {
  const form = new FormData();
  form.append("password", "teacher-password");
  form.append("file", new File(["schedule"], "연간시간표.hwp"));
  const response = await handleParseCreativeActivities(new Request("http://local/api", { method: "POST", body: form }), deps);
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(body.activities[0]).toMatchObject({ date: "3/4", category: "자율" });
  expect(JSON.stringify(body)).not.toContain("scheduleText");
  expect(deps.saveUsageEvent).toHaveBeenCalledOnce();
});
```

같은 파일에 비활성 계정 403, 비밀번호 오류 401, `.docx` 400, 10MB 초과 413, 월 한도 429, 요청 제한 429, 추출 실패 422, 잘못된 AI JSON 502, 사용량 저장 실패 503 테스트를 각각 추가한다.

- [ ] **Step 2: 라우트 부재로 실패 확인**

Run: `pnpm test:run tests/api/creative-activities-parse.test.ts`

Expected: FAIL resolving route.

- [ ] **Step 3: 검증과 공통 보안 경계 구현**

`handleParseCreativeActivities(request, dependencies)`를 의존성 주입 가능하게 만들고 처리 순서를 고정한다.

```ts
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_EXTRACTED_TEXT = 60_000;
const ALLOWED_EXTENSIONS = new Set(["hwp", "hwpx", "pdf"]);
```

순서: `requireActiveSubscription` → multipart 크기/본문 검증 → 비밀번호 timing-safe 비교 → IP rate limit → 월 사용량 → 파일 확장자/크기 → `extractDocumentText(file).slice(0, MAX_EXTRACTED_TEXT)` → OpenAI → 비용 계산 → 사용량 저장 → 결과 반환.

학교·학급 식별 헤더를 보내지 않도록 OpenAI 호출 전 줄 단위로 다음 패턴을 제거한다.

```ts
function redactScheduleIdentifiers(text: string): string {
  return text.split(/\r?\n/u)
    .filter((line) => !/(학교명|담임|교사명|\d+학년\s*\d+반)/u.test(line))
    .join("\n");
}
```

서버 오류 응답에는 원문, 파일명, OpenAI 응답을 넣지 않는다.

- [ ] **Step 4: API 집중 테스트 통과 확인**

Run: `pnpm test:run tests/api/creative-activities-parse.test.ts`

Expected: all route tests PASS.

- [ ] **Step 5: 변경 파일만 커밋**

```bash
git add app/api/creative-activities/parse/route.ts tests/api/creative-activities-parse.test.ts
git commit -m "feat: add protected creative schedule analysis API"
```

---

### Task 7: 창체 평어 생성 API

**Files:**
- Create: `app/api/creative-activities/generate/route.ts`
- Create: `tests/api/creative-activities-generate.test.ts`

**Interfaces:**
- Consumes: JSON `{ password, rows: [{ id, date, category, activity, hours }] }`.
- Produces: `{ rows: [{ id, comment }], usage }`.

- [ ] **Step 1: 검토 완료 행만 생성하는 실패 테스트 작성**

```ts
const body = {
  password: "teacher-password",
  rows: [
    { id: "row-1", date: "4/7", category: "자율", activity: "다문화 교육", hours: 1 },
    { id: "row-2", date: "4/7", category: "봉사", activity: "교내 환경 정리", hours: 1 },
  ],
};

it("같은 날짜의 두 활동을 두 평어로 반환한다", async () => {
  const response = await handleGenerateCreativeActivities(jsonRequest(body), deps);
  const result = await response.json();
  expect(result.rows).toHaveLength(2);
  expect(result.rows.map((row: { id: string }) => row.id)).toEqual(["row-1", "row-2"]);
  expect(deps.saveUsageEvent).toHaveBeenCalledOnce();
});
```

비활성 사용자, 잘못된 비밀번호, 51행 초과, 확인되지 않은 구분, 잘못된 날짜, 예산 초과, rate limit, JSON 오류, id 불일치 응답, 사용량 저장 실패 테스트를 추가한다.

- [ ] **Step 2: 라우트 부재 실패 확인**

Run: `pnpm test:run tests/api/creative-activities-generate.test.ts`

Expected: FAIL resolving route.

- [ ] **Step 3: Zod 요청 스키마와 공통 처리 구현**

```ts
const requestSchema = z.object({
  password: z.string().min(1).max(200),
  rows: z.array(z.object({
    id: z.string().min(1).max(100),
    date: z.string().regex(/^\d{1,2}\/\d{1,2}$/u),
    category: z.enum(CREATIVE_CATEGORIES),
    activity: z.string().min(1).max(200),
    hours: z.number().int().min(1).max(8),
  }).strict()).min(1).max(50),
}).strict();
```

기존 generate-report 라우트와 같은 순서 및 오류 코드를 사용하고 `max_output_tokens`는 3000으로 제한한다. DB에는 토큰 수, 비용, 모델, 시각만 저장한다.

- [ ] **Step 4: 집중 테스트 통과 확인**

Run: `pnpm test:run tests/api/creative-activities-generate.test.ts`

Expected: all route tests PASS.

- [ ] **Step 5: 변경 파일만 커밋**

```bash
git add app/api/creative-activities/generate/route.ts tests/api/creative-activities-generate.test.ts
git commit -m "feat: add protected creative comment generation API"
```

---

### Task 8: 창체 분석·검토·생성 화면

**Files:**
- Create: `components/CreativeActivityGenerator.tsx`
- Create: `tests/creative-activity-generator.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `/api/creative-activities/parse`, `/api/creative-activities/generate`.
- Produces: 편집 가능한 검토 행과 최종 `날짜 | 평어` 표; 원본 파일/전체 텍스트는 세션에 저장하지 않음.

- [ ] **Step 1: 사용자 흐름 실패 테스트 작성**

```tsx
it("시간표를 분석하고 검토한 두 활동을 날짜와 평어 두 열로 표시한다", async () => {
  const user = userEvent.setup();
  render(<CreativeActivityGenerator />);
  await user.upload(screen.getByLabelText("연간시간표 파일"),
    new File(["schedule"], "연간시간표.hwp"));
  await user.type(screen.getByLabelText("교사 접근 비밀번호"), "password");
  await user.click(screen.getByRole("button", { name: "시간표 분석" }));
  expect(await screen.findByDisplayValue("다문화 교육")).toBeInTheDocument();
  expect(screen.getByDisplayValue("진로 탐색")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));
  const resultTable = await screen.findByRole("table", { name: "창체 평어 결과" });
  expect(within(resultTable).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["날짜", "평어"]);
  expect(within(resultTable).getAllByText("4/7")).toHaveLength(2);
});
```

별도 테스트로 `needsReview: true` 행의 생성 차단, 직접 수정한 활동명이 생성 요청에 포함됨, 행 추가/선택 삭제, 복사 형식, CSV BOM, 초기화, `sessionStorage`에 파일/전체 추출 텍스트가 없음도 검증한다.

- [ ] **Step 2: 컴포넌트 부재 실패 확인**

Run: `pnpm test:run tests/creative-activity-generator.test.tsx`

Expected: FAIL resolving component.

- [ ] **Step 3: 파일·분석 상태와 검토 표 구현**

상태는 다음 최소 구조만 둔다.

```tsx
const [file, setFile] = useState<File | null>(null);
const [rows, setRows] = useState<CreativeActivityRow[]>([]);
const [password, setPassword] = useState("");
const [busy, setBusy] = useState<"parse" | "generate" | null>(null);
const [notice, setNotice] = useState<{ type: "info" | "error" | "success"; message: string } | null>(null);
```

검토 표 열은 `선택`, `날짜`, `시수`, `구분`, `추출한 활동`, `확인 상태`로 구현한다. `needsReview` 행은 빨간 `확인 필요` 버튼을 누르면 `needsReview: false`로 바꿀 수 있게 하고 날짜·시수·활동 변경 시 다시 확인 필요로 둔다. `동아리` 옵션은 select에 제공하지 않는다.

- [ ] **Step 4: 분석과 생성 요청 구현**

```tsx
const form = new FormData();
form.append("password", password);
form.append("file", file);
const response = await fetch("/api/creative-activities/parse", { method: "POST", body: form });
```

생성 시 `needsReview === false`이고 선택된 행(선택이 없으면 전체)을 보내며 응답 id로 기존 행에 comment를 병합한다. 확인 필요 행이 포함되면 API 호출 전에 오류 안내를 표시한다.

- [ ] **Step 5: 복사·CSV·최종 2열 표 구현**

```tsx
const text = ["날짜\t평어", ...resultRows.map((row) => `${row.date}\t${row.comment}`)].join("\n");
```

CSV 파일명은 `창의적체험활동-평어.csv`, 헤더는 `날짜,평어`로 둔다. 최종 결과 표는 `aria-label="창체 평어 결과"`를 주고 날짜 열 고정폭, 평어 열 가변폭으로 구성한다. 동일 날짜도 병합하지 않는다.

- [ ] **Step 6: 업무용 스타일 구현**

```css
.creative-review-table .col-date { width: 92px; }
.creative-review-table .col-hours { width: 76px; }
.creative-review-table .col-category { width: 110px; }
.creative-result-table { width: 100%; table-layout: fixed; }
.creative-result-table .col-date { width: 100px; }
.creative-result-table .col-comment { width: auto; }
.creative-result-table textarea { min-height: 92px; font-size: 14px; line-height: 1.7; }
```

- [ ] **Step 7: 집중 테스트와 접근성 확인**

Run: `pnpm test:run tests/creative-activity-generator.test.tsx && pnpm typecheck`

Expected: component tests PASS, TypeScript exits 0.

- [ ] **Step 8: 변경 파일만 커밋**

```bash
git add components/CreativeActivityGenerator.tsx tests/creative-activity-generator.test.tsx app/globals.css
git commit -m "feat: add creative activity review and result workspace"
```

---

### Task 9: 상단 메뉴·사이드바·페이지 통합

**Files:**
- Modify: `components/AppShell.tsx`
- Modify: `components/Sidebar.tsx`
- Modify: `app/page.tsx`
- Modify: `tests/app-shell.test.tsx`

**Interfaces:**
- Consumes: Task 8 `CreativeActivityGenerator`.
- Produces: 상단 `창의적 체험활동` 탭과 사이드바 `창체 활동 평어 작성기`.

- [ ] **Step 1: 메뉴 전환 실패 테스트 추가**

```tsx
it("창의적 체험활동 탭에서 창체 평어 작성기를 보여준다", async () => {
  const user = userEvent.setup();
  render(
    <AppShell creativeActivity={<div>창체 작성 화면</div>} club={<div>동아리 화면</div>}>
      <div>교과 화면</div>
    </AppShell>,
  );
  await user.click(screen.getByRole("button", { name: "창의적 체험활동" }));
  expect(screen.getByText("창체 작성 화면")).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "창체관리" })).toHaveTextContent("창체 활동 평어 작성기");
});
```

- [ ] **Step 2: prop/menu 부재로 실패 확인**

Run: `pnpm test:run tests/app-shell.test.tsx`

Expected: FAIL because `creativeActivity` and menu do not exist.

- [ ] **Step 3: AppShell과 Sidebar에 메뉴 연결**

```tsx
const topMenus = ["교과평어", "동아리활동", "창의적 체험활동", "행동특성", "설정"] as const;

type AppShellProps = {
  children: ReactNode;
  club?: ReactNode;
  creativeActivity?: ReactNode;
  settings?: ReactNode;
  showSettings?: boolean;
};
```

`activeMenu === "창의적 체험활동"`이면 `creativeActivity`를 표시하고 Sidebar는 다음 구성을 반환한다.

```ts
const creativeMenus = [
  { label: "창의적 체험활동", kind: "group" },
  { label: "창체 활동 평어 작성기", selected: true },
] as const;
```

- [ ] **Step 4: page.tsx에서 화면 전달**

```tsx
<AppShell
  club={<ClubActivityGenerator />}
  creativeActivity={<CreativeActivityGenerator />}
  settings={isAdmin ? <AdminApprovalPanel /> : undefined}
  showSettings={isAdmin}
>
  <ReportGenerator />
</AppShell>
```

- [ ] **Step 5: 메뉴 집중 테스트 통과 확인**

Run: `pnpm test:run tests/app-shell.test.tsx`

Expected: all AppShell tests PASS and `출결자료` remains absent.

- [ ] **Step 6: 변경 파일만 커밋**

```bash
git add components/AppShell.tsx components/Sidebar.tsx app/page.tsx tests/app-shell.test.tsx
git commit -m "feat: integrate creative activity workspace"
```

---

### Task 10: 전체 회귀·보안·브라우저 검증

**Files:**
- Modify if a verified defect is found: only the file causing that defect
- Create: `docs/solutions/architecture-patterns/privacy-safe-document-workspaces.md`

**Interfaces:**
- Consumes: Tasks 1~9 전체.
- Produces: 회귀 없는 빌드, 개인정보 저장 경계 검증, 재사용 가능한 교훈 문서.

- [ ] **Step 1: 전체 자동 테스트 실행**

Run: `pnpm test:run`

Expected: all tests PASS with zero unhandled errors.

- [ ] **Step 2: 타입 검사와 프로덕션 빌드 실행**

Run: `pnpm typecheck && pnpm build`

Expected: both commands exit 0; creative parse/generate routes appear in build output.

- [ ] **Step 3: 비밀·개인정보·브라우저 저장소 정적 검사**

Run: `rg -n "NEXT_PUBLIC_OPENAI|OPENAI_API_KEY|localStorage|console\.(log|error).*?(text|file|student|name)|sessionStorage.*?(worksheet|resultFile|studentName|email)" app components lib tests`

Expected: 클라이언트 API 키 참조 0건, `localStorage` 0건, 원문 로그 0건, 민감 자료 세션 저장 0건. 테스트의 의도적 문자열만 나오면 해당 줄을 직접 검토한다.

- [ ] **Step 4: 실제 브라우저 흐름 확인**

Run: `pnpm dev -- --webpack --hostname 127.0.0.1 --port 3000`

Expected manual checks:

1. Google 로그인·승인 계정에서만 화면 진입.
2. 동아리 메모 생성 후 메뉴 왕복·새로고침에도 복원, 탭을 닫고 새 탭을 열면 사라짐.
3. 전체 평가 계획 분석 후 국어→사회 전환·새로고침에도 파일명/추출 내용 재사용.
4. 수행평가지·평가 결과 파일은 새로고침 후 사라지고 세션 저장소에 없음.
5. 시간표 HWP/HWPX/PDF 분석 시 창체·자율·봉사·진로만 표시되고 동아리는 없음.
6. 같은 날짜 두 활동은 검토표와 최종표에서 두 행.
7. 확인 필요 행은 수정·확인 전 생성 차단.
8. 최종표는 `날짜 | 평어` 두 열이며 복사·CSV가 일치.
9. 월 한도와 비활성 사용자 오류가 원문 없이 안내됨.

- [ ] **Step 5: Compound Engineering 교훈 문서 작성**

`compound-engineering:ce-compound`를 사용해 다음 검증된 교훈만 기록한다.

```markdown
# 개인정보를 저장하지 않는 문서 작업공간

- 원본 파일과 전체 추출 텍스트는 요청 수명 안에서만 사용한다.
- 브라우저 연속성은 버전 검증된 sessionStorage에 최소 파생 데이터만 둔다.
- 표 구조가 깨질 수 있는 HWP는 AI 구조화 결과를 바로 확정하지 않고 교사 검토 단계를 둔다.
- 분석과 생성 API 모두 인증·비밀번호·요청 제한·예산·사용량 저장 경계를 공유한다.
```

- [ ] **Step 6: 최종 변경 상태 확인**

Run: `git status --short`

Expected: 이번 계획 파일과 구현 파일만 의도대로 추가·수정되어 있고 기존 사용자 변경은 유지됨.
