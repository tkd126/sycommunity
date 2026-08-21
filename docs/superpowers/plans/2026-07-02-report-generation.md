# Document Analysis and Report Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PDF·HWP·HWPX 평가자료를 로컬에서 분석하고 학생 이름을 제외한 번호 기반 데이터로 OpenAI 교과 평어를 생성하며 월 30,000원 한도를 로컬 PostgreSQL로 강제한다.

**Architecture:** 문서 파일은 `parse-documents` 서버 라우트에서 메모리로만 추출하고 번호·성취 단계와 참고 텍스트를 검토용 JSON으로 반환한다. 확인된 번호 기반 데이터만 `generate-report` 서버 라우트로 보내며, 서버가 비밀번호·속도·예산을 검사한 뒤 OpenAI Responses API를 호출한다. 학생 이름과 문서 원문은 저장하거나 OpenAI에 보내지 않고, PostgreSQL에는 최소 사용량 정보만 기록한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Testing Library, OpenAI Node SDK, Zod, Prisma 6, PostgreSQL, pdfjs-dist, @ssabrojs/hwpxjs

---

## File map

### Create

- `app/api/parse-documents/route.ts` — multipart 파일 검증과 로컬 문서 분석 API
- `app/api/generate-report/route.ts` — 인증·예산·OpenAI 생성 API
- `app/api/usage/route.ts` — 이번 달 사용량 반환 API
- `components/DocumentReviewPanel.tsx` — 추출된 영역·번호·단계 검토 UI
- `lib/document-extraction.ts` — PDF, HWP, HWPX 텍스트 추출
- `lib/achievement-parser.ts` — 학생 번호와 성취 단계 구조화
- `lib/openai.ts` — Responses API 호출과 구조화 출력
- `lib/prompt.ts` — 번호 기반 시스템·사용자 프롬프트
- `lib/sanitize.ts` — 금지어·제품명·외국어·특수문자 검사
- `lib/usage.ts` — 비용 계산, 월 합계와 사용량 저장
- `lib/rate-limit.ts` — IP 기반 메모리 요청 제한
- `lib/db.ts` — Prisma 단일 인스턴스
- `lib/server-config.ts` — 서버 환경변수 파싱
- `types/documents.ts` — 문서 분석 타입
- `prisma/schema.prisma` — UsageEvent 모델
- `tests/document-extraction.test.ts` — 형식별 추출 테스트
- `tests/achievement-parser.test.ts` — 번호·단계 구조화 테스트
- `tests/sanitize.test.ts` — 결과 후처리 테스트
- `tests/usage.test.ts` — 비용과 한도 테스트
- `tests/prompt.test.ts` — 학생 이름 비전송 테스트
- `tests/document-review-panel.test.tsx` — 검토 표 수정 테스트
- `tests/api/parse-documents.test.ts` — 분석 API 검증 테스트
- `tests/api/generate-report.test.ts` — 생성 순서와 보안 테스트
- `.env.example` — 값 없는 환경변수 예시

### Modify

- `components/AppShell.tsx` — 출결자료 상단 탭 제거
- `components/ReportGenerator.tsx` — 분석·검토·실제 생성 흐름 연결
- `components/UsageBadge.tsx` — 실제 사용량 API 상태 표시
- `app/globals.css` — 검토 표와 진행 상태 스타일
- `types/report.ts` — 번호 기반 생성 요청·응답 타입 추가
- `tests/app-shell.test.tsx` — 출결자료 제거 검증
- `tests/report-generator.test.tsx` — 분석 후 생성 흐름 검증
- `README.md` — 로컬 PostgreSQL, 환경변수, 보안 경계와 실행법
- `README_HANDOFF.md` — 2단계 상태와 제한 갱신
- `package.json`, `pnpm-lock.yaml` — 서버 의존성 추가

---

### Task 1: UI 메뉴와 문체 예시 확장

**Files:**
- Modify: `components/AppShell.tsx`
- Modify: `components/ReportGenerator.tsx`
- Modify: `tests/app-shell.test.tsx`
- Modify: `tests/report-generator.test.tsx`

- [ ] **Step 1: 출결자료 제거와 7개 문체 선택 실패 테스트 작성**

```tsx
it("출결자료 메뉴를 표시하지 않는다", () => {
  render(<AppShell><div>본문</div></AppShell>);
  expect(screen.queryByRole("button", { name: "출결자료" })).not.toBeInTheDocument();
});

it("일곱 가지 문체 예시를 선택할 수 있다", () => {
  render(<ReportGenerator />);
  const options = within(screen.getByLabelText("예시문 선택")).getAllByRole("option");
  expect(options.map((option) => option.textContent)).toEqual([
    "긍정 강조형", "성장 중심형", "협력 중심형", "탐구 중심형",
    "성실 참여형", "간결형", "구체적 서술형",
  ]);
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test:run -- tests/app-shell.test.tsx tests/report-generator.test.tsx`

Expected: 출결자료가 남아 있고 예시 선택지가 3개라 FAIL.

- [ ] **Step 3: 메뉴와 예시 상수 최소 수정**

```ts
const topMenus = ["교과평어", "동아리활동", "행동특성", "설정"];

const EXAMPLE_PRESETS = [
  { id: "positive", label: "긍정 강조형", text: "학습 내용을 정확히 이해하고 자신의 강점을 살려 활동에 적극적으로 참여함." },
  { id: "growth", label: "성장 중심형", text: "기초를 다지며 배운 내용을 꾸준히 익혀 가고 점차 향상되는 모습을 보임." },
  { id: "collaboration", label: "협력 중심형", text: "서로의 의견을 존중하고 맡은 역할에 책임감 있게 참여하며 함께 해결함." },
  { id: "inquiry", label: "탐구 중심형", text: "학습 주제에 호기심을 가지고 다양한 방법으로 탐색하며 생각을 확장함." },
  { id: "diligence", label: "성실 참여형", text: "수업 활동에 꾸준하고 성실하게 참여하며 배운 내용을 차분히 정리함." },
  { id: "concise", label: "간결형", text: "핵심 내용을 이해하고 자신의 생각을 분명하게 표현하며 활동에 성실히 참여함." },
  { id: "specific", label: "구체적 서술형", text: "자료에서 필요한 정보를 찾아 기준에 따라 정리하고 알맞은 근거를 들어 설명함." },
] as const;
```

- [ ] **Step 4: 대상 테스트 통과 확인**

Run: `pnpm test:run -- tests/app-shell.test.tsx tests/report-generator.test.tsx`

Expected: PASS.

### Task 2: 서버 의존성과 공유 타입

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `types/documents.ts`
- Modify: `types/report.ts`

- [ ] **Step 1: 서버 라이브러리 설치**

Run:

```bash
pnpm add openai zod @prisma/client@6 pdfjs-dist @ssabrojs/hwpxjs
pnpm add -D prisma@6
```

Expected: lockfile이 갱신되고 설치 오류가 없어야 한다.

- [ ] **Step 2: 문서·생성 공유 타입 작성**

```ts
export const ACHIEVEMENT_LEVELS = ["매우 잘함", "잘함", "보통", "노력 요함"] as const;
export type AchievementLevel = (typeof ACHIEVEMENT_LEVELS)[number];

export type ParsedStudentLevel = {
  studentNumber: number;
  level: AchievementLevel | "";
  rawLevel: string;
  confirmed: boolean;
};

export type ParsedArea = {
  areaId: string;
  areaName: string;
  students: ParsedStudentLevel[];
  warnings: string[];
};

export type DocumentAnalysisResponse = {
  areas: ParsedArea[];
  evaluationPlanText: string;
  worksheetText: string;
  warnings: string[];
};
```

`types/report.ts`에 다음을 추가한다.

```ts
export type GenerateStudentInput = {
  studentNumber: number;
  levels: Array<{ areaName: string; level: AchievementLevel }>;
};

export type GeneratedReportRow = {
  studentNumber: number;
  selectedLevels: string;
  comment: string;
};
```

- [ ] **Step 3: 타입 검사**

Run: `pnpm typecheck`

Expected: PASS.

### Task 3: 성취 단계 정규화와 번호 구조화

**Files:**
- Create: `lib/achievement-parser.ts`
- Create: `tests/achievement-parser.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { normalizeLevel, parseStudentLevels } from "@/lib/achievement-parser";

it.each([
  ["매우잘함", "매우 잘함"],
  ["잘함", "잘함"],
  ["보통", "보통"],
  ["노력요함", "노력 요함"],
])("%s를 정규화한다", (input, expected) => {
  expect(normalizeLevel(input)).toBe(expected);
});

it("이름을 반환하지 않고 번호와 단계만 구조화한다", () => {
  const result = parseStudentLevels("1 김하늘 매우잘함\n2 이가람 잘함\n3 박도윤 노력 요함");
  expect(result).toEqual([
    { studentNumber: 1, level: "매우 잘함", rawLevel: "매우잘함", confirmed: true },
    { studentNumber: 2, level: "잘함", rawLevel: "잘함", confirmed: true },
    { studentNumber: 3, level: "노력 요함", rawLevel: "노력 요함", confirmed: true },
  ]);
  expect(JSON.stringify(result)).not.toContain("김하늘");
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test:run -- tests/achievement-parser.test.ts`

Expected: 모듈 부재로 FAIL.

- [ ] **Step 3: 최소 파서 구현**

```ts
import type { AchievementLevel, ParsedStudentLevel } from "@/types/documents";

const LEVEL_PATTERN = /(매우\s*잘함|잘함|보통|노력\s*요함)/;

export function normalizeLevel(value: string): AchievementLevel | "" {
  const compact = value.replaceAll(/\s/g, "");
  if (compact === "매우잘함") return "매우 잘함";
  if (compact === "잘함") return "잘함";
  if (compact === "보통") return "보통";
  if (compact === "노력요함") return "노력 요함";
  return "";
}

export function parseStudentLevels(text: string): ParsedStudentLevel[] {
  return text.split(/\r?\n/).flatMap((line) => {
    const numberMatch = line.match(/^\s*(\d{1,3})(?:\s|번)/);
    const levelMatch = line.match(LEVEL_PATTERN);
    if (!numberMatch || !levelMatch) return [];
    const level = normalizeLevel(levelMatch[1]);
    return [{
      studentNumber: Number(numberMatch[1]),
      level,
      rawLevel: levelMatch[1],
      confirmed: Boolean(level),
    }];
  });
}
```

- [ ] **Step 4: 중복 번호와 미확인 단계 테스트 추가**

```ts
it("중복 번호를 오류로 보고한다", () => {
  expect(() => parseStudentLevels("1 김하늘 잘함\n1 이가람 보통"))
    .toThrow("학생 번호가 중복되었습니다: 1");
});
```

파서 마지막에 중복 번호 집합을 검사해 정확히 위 메시지를 던진다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test:run -- tests/achievement-parser.test.ts`

Expected: PASS.

### Task 4: PDF·HWP·HWPX 텍스트 추출

**Files:**
- Create: `lib/document-extraction.ts`
- Create: `tests/document-extraction.test.ts`
- Create: `tests/fixtures/README.md`

- [ ] **Step 1: 형식 라우팅과 빈 문서 실패 테스트 작성**

```ts
import { extractDocumentText } from "@/lib/document-extraction";

it("지원하지 않는 확장자를 거부한다", async () => {
  await expect(extractDocumentText(new Uint8Array([1, 2]), "plan.docx"))
    .rejects.toThrow("지원하지 않는 문서 형식입니다");
});

it("추출 텍스트가 비어 있으면 스캔 또는 보호 문서로 안내한다", async () => {
  await expect(extractDocumentText(new Uint8Array(), "empty.pdf"))
    .rejects.toThrow("문서에서 읽을 수 있는 글자를 찾지 못했습니다");
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test:run -- tests/document-extraction.test.ts`

Expected: 모듈 부재로 FAIL.

- [ ] **Step 3: 추출 함수 구현**

```ts
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import HwpxReader, { hwpToText } from "@ssabrojs/hwpxjs";

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocument({ data: bytes }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = content.items
      .filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item)
      .sort((a, b) => Math.abs(b.transform[5] - a.transform[5]) > 2
        ? b.transform[5] - a.transform[5]
        : a.transform[4] - b.transform[4])
      .map((item) => item.str.trim())
      .filter(Boolean);
    pages.push(lines.join("\n"));
  }
  return pages.join("\n");
}

async function extractHwpxText(bytes: Uint8Array): Promise<string> {
  const reader = new HwpxReader();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  await reader.loadFromArrayBuffer(buffer);
  return reader.extractText();
}

export async function extractDocumentText(bytes: Uint8Array, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  let text = "";
  if (lower.endsWith(".pdf")) text = await extractPdfText(bytes);
  else if (lower.endsWith(".hwp")) text = await hwpToText(bytes);
  else if (lower.endsWith(".hwpx")) text = await extractHwpxText(bytes);
  else throw new Error("지원하지 않는 문서 형식입니다");
  const normalized = text.replaceAll("\u0000", "").replaceAll(/[ \t]+/g, " ").trim();
  if (!normalized) throw new Error("문서에서 읽을 수 있는 글자를 찾지 못했습니다. 스캔 또는 보호 문서인지 확인해 주세요");
  return normalized;
}
```

- [ ] **Step 4: 개인정보 없는 합성 fixture 작성 원칙 문서화**

`tests/fixtures/README.md`에 실제 학생 이름을 넣지 않고 `1 홍길동 잘함` 같은 합성 자료만 저장한다고 명시한다. 실제 학교 파일은 저장소에 추가하지 않고 로컬 수동 검증에만 사용한다.

- [ ] **Step 5: 실제 라이브러리 export와 타입에 맞춰 컴파일 조정**

Run: `pnpm typecheck`

Expected: PASS. `@ssabrojs/hwpxjs` 실제 export가 다르면 패키지의 설치된 `dist/*.d.ts`에서 공개 API를 확인해 동일 기능의 공개 함수로만 수정한다.

- [ ] **Step 6: 테스트 통과 확인**

Run: `pnpm test:run -- tests/document-extraction.test.ts`

Expected: PASS.

### Task 5: 문서 분석 API

**Files:**
- Create: `app/api/parse-documents/route.ts`
- Create: `tests/api/parse-documents.test.ts`

- [ ] **Step 1: 파일 제한과 이름 제거 실패 테스트 작성**

```ts
it("영역 PDF 분석 응답에 학생 이름을 포함하지 않는다", async () => {
  const form = new FormData();
  form.append("areas", JSON.stringify([{ areaId: "area-1", areaName: "문학", fileKey: "area-file-1" }]));
  form.append("area-file-1", new File([fixturePdf], "문학.pdf", { type: "application/pdf" }));
  const response = await POST(new Request("http://localhost/api/parse-documents", { method: "POST", body: form }));
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(JSON.stringify(body)).not.toContain("홍길동");
  expect(body.areas[0].students[0]).toMatchObject({ studentNumber: 1, level: "잘함" });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test:run -- tests/api/parse-documents.test.ts`

Expected: 라우트 부재로 FAIL.

- [ ] **Step 3: 요청 제한과 부분 성공 라우트 구현**

상수는 다음으로 고정한다.

```ts
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_AREA_FILES = 5;
const MAX_REFERENCE_FILES = 10;
```

라우트는 `areas` JSON을 Zod로 검증하고 각 파일을 `Uint8Array`로 변환한다. 각 영역 파일은 독립 `try/catch`로 분석해 성공 영역과 다음 오류 형식을 함께 반환한다.

```ts
type FileAnalysisError = { fileName: string; code: "INVALID_FILE" | "NO_TEXT" | "PARSE_FAILED"; message: string };
```

평가 계획과 수행평가지 추출 텍스트는 각각 최대 30,000자로 자르고 응답에 포함한다. `console.log`에 FormData, 파일명, 텍스트 또는 오류 객체 전체를 기록하지 않는다.

- [ ] **Step 4: 파일 크기·개수·부분 실패 테스트 추가**

각 제한에 대해 상태 400과 안전한 한국어 오류 코드가 반환되는지, 한 파일이 실패해도 다른 성공 영역이 유지되는지 검사한다.

- [ ] **Step 5: 대상 테스트 통과 확인**

Run: `pnpm test:run -- tests/api/parse-documents.test.ts tests/document-extraction.test.ts tests/achievement-parser.test.ts`

Expected: PASS.

### Task 6: 프롬프트와 후처리

**Files:**
- Create: `lib/prompt.ts`
- Create: `lib/sanitize.ts`
- Create: `tests/prompt.test.ts`
- Create: `tests/sanitize.test.ts`

- [ ] **Step 1: 이름 비전송과 금지어 실패 테스트 작성**

```ts
it("프롬프트에는 학생 번호만 포함한다", () => {
  const prompt = buildReportPrompt({ subject: "국어", students: [{ studentNumber: 1, levels: [] }], evaluationPlan: "계획", worksheets: "문항", example: "예시", instruction: "" });
  expect(prompt).toContain("학생 번호 1");
  expect(prompt).not.toContain("name");
  expect(prompt).not.toContain("성명");
});

it("제품명과 금지 표현을 바꾼다", () => {
  expect(sanitizeComment("학생은 레고를 잘하지 못함."))
    .toBe("블록 장난감을 활용하며 해결 방법을 익혀 가고 있음.");
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test:run -- tests/prompt.test.ts tests/sanitize.test.ts`

Expected: 모듈 부재로 FAIL.

- [ ] **Step 3: 프롬프트 구현**

`buildReportPrompt`는 승인된 설계의 교과 영역 수, 단계 우선순위, 긍정 표현, 금지어, JSON 필드를 모두 명시한다. 학생 입력 타입에는 `studentNumber`와 `levels`만 허용하고 문자열화 전에 Zod `.strict()`로 여분 키를 거부한다.

- [ ] **Step 4: 후처리 구현**

```ts
const REPLACEMENTS: Array<[RegExp, string]> = [
  [/레고/g, "블록 장난감"], [/클레이/g, "점토"],
  [/스크래치/g, "블록형 코딩 도구"], [/비티에스/g, "대중가요"],
  [/학생은\s*/g, ""], [/학생의\s*/g, ""], [/그는\s*/g, ""], [/그의\s*/g, ""],
  [/잘하지 못함/g, "해결 방법을 익혀 가고 있음"], [/부족함/g, "기초를 다지며 향상되고 있음"],
  [/미달함/g, "꾸준히 익혀 가고 있음"], [/못함/g, "노력함"],
];

export function sanitizeComment(input: string): string {
  const replaced = REPLACEMENTS.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), input);
  return replaced.replaceAll(/[^가-힣0-9\s.,]/g, "").replaceAll(/\s+/g, " ").trim();
}
```

- [ ] **Step 5: 대상 테스트 통과 확인**

Run: `pnpm test:run -- tests/prompt.test.ts tests/sanitize.test.ts`

Expected: PASS.

### Task 7: 로컬 PostgreSQL과 사용량 계산

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`
- Create: `lib/usage.ts`
- Create: `tests/usage.test.ts`

- [ ] **Step 1: PostgreSQL 설치 상태 읽기 전용 확인**

Run:

```powershell
Get-Service *postgres* -ErrorAction SilentlyContinue
psql --version
```

Expected: 로컬 PostgreSQL 서비스와 `psql`이 확인된다. 둘 다 없으면 자동 설치하지 말고 사용자에게 PostgreSQL 16 이상 설치 승인을 요청한다.

- [ ] **Step 2: 비용 계산 실패 테스트 작성**

```ts
it("토큰 비용을 원 단위로 올림 계산한다", () => {
  expect(calculateCostKrw({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, {
    inputPricePer1MUsd: 0.4, outputPricePer1MUsd: 1.6, usdKrwRate: 1400,
  })).toBe(2800);
});

it("한도 이상이면 차단한다", () => {
  expect(getBudgetStatus(30000, 30000)).toBe("limit");
  expect(getBudgetStatus(27000, 30000)).toBe("warning");
});
```

- [ ] **Step 3: 실패 확인**

Run: `pnpm test:run -- tests/usage.test.ts`

Expected: 모듈 부재로 FAIL.

- [ ] **Step 4: Prisma 스키마와 단일 인스턴스 작성**

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
model UsageEvent {
  id String @id @default(cuid())
  inputTokens Int
  outputTokens Int
  costKrw Int
  model String
  createdAt DateTime @default(now())
}
```

`lib/db.ts`는 개발 중 재로딩에서도 하나의 `PrismaClient`만 재사용한다.

- [ ] **Step 5: 사용량 함수 구현**

```ts
export function calculateCostKrw(tokens: TokenUsage, prices: Prices): number {
  const usd = tokens.inputTokens / 1_000_000 * prices.inputPricePer1MUsd
    + tokens.outputTokens / 1_000_000 * prices.outputPricePer1MUsd;
  return Math.ceil(usd * prices.usdKrwRate);
}
export function getBudgetStatus(total: number, budget: number) {
  if (total >= budget) return "limit" as const;
  if (total >= Math.min(27000, budget * 0.9)) return "warning" as const;
  return "normal" as const;
}
```

DB 함수는 로컬 시간대가 아니라 UTC 월 시작·다음 달 시작 범위를 만들어 `aggregate({_sum:{costKrw:true}})`로 합산한다.

- [ ] **Step 6: 테스트 통과와 Prisma 클라이언트 생성**

Run:

```bash
pnpm prisma generate
pnpm test:run -- tests/usage.test.ts
```

Expected: PASS.

### Task 8: 서버 설정과 요청 빈도 제한

**Files:**
- Create: `lib/server-config.ts`
- Create: `lib/rate-limit.ts`
- Create: `tests/server-config.test.ts`
- Create: `tests/rate-limit.test.ts`

- [ ] **Step 1: 누락 환경변수와 속도 제한 실패 테스트 작성**

```ts
it("API 키가 없으면 안전한 설정 오류를 낸다", () => {
  expect(() => readServerConfig({ TEACHER_ACCESS_PASSWORD: "pw", DATABASE_URL: "postgres://local" }))
    .toThrow("OPENAI_API_KEY 환경변수가 필요합니다");
});

it("같은 IP의 60초 내 세 번째 요청을 차단한다", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
  expect(limiter.check("127.0.0.1", 0)).toBe(true);
  expect(limiter.check("127.0.0.1", 1)).toBe(true);
  expect(limiter.check("127.0.0.1", 2)).toBe(false);
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test:run -- tests/server-config.test.ts tests/rate-limit.test.ts`

Expected: 모듈 부재로 FAIL.

- [ ] **Step 3: Zod 설정과 메모리 limiter 구현**

설정 기본값은 `OPENAI_MODEL=gpt-4.1-mini`, `MONTHLY_BUDGET_KRW=30000`, `USD_KRW_RATE=1400`, 입력 가격 `0.40`, 출력 가격 `1.60`으로 고정한다. API 키, 비밀번호와 DATABASE_URL은 필수이며 오류에는 값 자체를 포함하지 않는다.

rate limiter는 IP별 타임스탬프 배열만 메모리에 저장하고 60초가 지난 항목을 매 요청마다 제거한다. 학생 데이터나 요청 본문은 저장하지 않는다.

- [ ] **Step 4: 대상 테스트 통과 확인**

Run: `pnpm test:run -- tests/server-config.test.ts tests/rate-limit.test.ts`

Expected: PASS.

### Task 9: OpenAI 구조화 출력과 생성 API

**Files:**
- Create: `lib/openai.ts`
- Create: `app/api/generate-report/route.ts`
- Create: `tests/api/generate-report.test.ts`

- [ ] **Step 1: 이름 누출·비밀번호·예산 차단 실패 테스트 작성**

```ts
it("OpenAI 입력에는 학생 이름이 없다", async () => {
  const fakeCreate = vi.fn().mockResolvedValue(fakeStructuredResponse);
  await generateReports(validNumberOnlyRequest, { create: fakeCreate });
  expect(JSON.stringify(fakeCreate.mock.calls)).not.toContain("김하늘");
});

it("비밀번호가 틀리면 OpenAI를 호출하지 않는다", async () => {
  const create = vi.fn();
  const response = await callRoute({ ...validRequest, password: "wrong" }, { create });
  expect(response.status).toBe(401);
  expect(create).not.toHaveBeenCalled();
});

it("월 한도 이상이면 OpenAI를 호출하지 않는다", async () => {
  const create = vi.fn();
  const response = await callRoute(validRequest, { create, monthlyCostKrw: 30000 });
  expect(response.status).toBe(429);
  expect(create).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test:run -- tests/api/generate-report.test.ts`

Expected: 라우트와 생성 함수 부재로 FAIL.

- [ ] **Step 3: OpenAI 호출 구현**

```ts
const response = await client.responses.create({
  model: config.model,
  input: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
  max_output_tokens: 5000,
  text: {
    format: {
      type: "json_schema",
      name: "report_rows",
      strict: true,
      schema: reportResponseJsonSchema,
    },
  },
});
```

`response.output_text`를 JSON 파싱한 뒤 Zod로 `studentNumber`, `selectedLevels`, `comment`를 검증한다. 응답 번호가 요청 번호 집합과 정확히 일치하지 않으면 실패시킨다. 모든 comment에 `sanitizeComment`를 적용한다.

- [ ] **Step 4: 라우트 처리 순서 구현**

`POST`는 다음 순서를 코드 블록 단위로 유지한다: JSON 크기 제한 → Zod strict 검증 → timing-safe 비밀번호 비교 → IP rate limit → DB 월 합계 → 예산 차단 → OpenAI 호출 → 구조 검증·후처리 → 비용 저장 → 응답.

IP는 `x-forwarded-for`의 첫 값 또는 `x-real-ip`, 둘 다 없으면 `127.0.0.1`을 사용한다. 로그에는 오류 코드만 남긴다.

- [ ] **Step 5: 오류·토큰·저장 테스트 추가**

OpenAI가 JSON이 아닌 값을 반환할 때 502, usage가 없을 때 저장하지 않고 502, DB 저장 실패 때 결과를 반환하지 않고 503이 되는지 검사한다.

- [ ] **Step 6: 대상 테스트 통과 확인**

Run: `pnpm test:run -- tests/api/generate-report.test.ts tests/prompt.test.ts tests/sanitize.test.ts tests/usage.test.ts`

Expected: PASS.

### Task 10: 사용량 API

**Files:**
- Create: `app/api/usage/route.ts`
- Modify: `components/UsageBadge.tsx`
- Create: `tests/api/usage.test.ts`
- Modify: `tests/usage-badge.test.tsx`

- [ ] **Step 1: 사용량 응답 실패 테스트 작성**

```ts
it("월 사용량과 상태를 반환한다", async () => {
  const response = await GET();
  expect(await response.json()).toEqual({ amountKrw: 18420, budgetKrw: 30000, status: "normal" });
});
```

- [ ] **Step 2: 실패 확인 후 최소 라우트 구현**

라우트는 `getMonthlyUsageKrw`, `getBudgetStatus`와 환경 설정을 사용한다. DB 오류 시 금액을 0으로 위장하지 않고 상태 503을 반환한다.

- [ ] **Step 3: UsageBadge를 props 표시 구성 요소로 유지하고 ReportGenerator에서 fetch 연결**

마운트 시 `/api/usage`를 호출하며 실패하면 `사용량 확인 실패` 제한 배지를 표시하고 생성 버튼을 비활성화한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test:run -- tests/api/usage.test.ts tests/usage-badge.test.tsx`

Expected: PASS.

### Task 11: 문서 검토 UI와 실제 생성 연결

**Files:**
- Create: `components/DocumentReviewPanel.tsx`
- Create: `tests/document-review-panel.test.tsx`
- Modify: `components/ReportGenerator.tsx`
- Modify: `tests/report-generator.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: 검토 표 수정과 미확인 차단 실패 테스트 작성**

```tsx
it("추출 단계를 수정하고 확인할 수 있다", async () => {
  const user = userEvent.setup();
  render(<DocumentReviewPanel areas={areasWithUnknown} onChange={onChange} />);
  await user.selectOptions(screen.getByLabelText("1번 문학 성취 단계"), "잘함");
  await user.click(screen.getByRole("button", { name: "분석 결과 확인" }));
  expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([
    expect.objectContaining({ areaName: "문학", students: [expect.objectContaining({ studentNumber: 1, level: "잘함", confirmed: true })] }),
  ]));
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test:run -- tests/document-review-panel.test.tsx tests/report-generator.test.tsx`

Expected: 구성 요소 부재와 더미 생성으로 FAIL.

- [ ] **Step 3: DocumentReviewPanel 구현**

영역별 접이식 표에 번호와 단계 select를 표시한다. 이름은 표시하지 않는다. 중복 번호, 빈 단계, 화면 학생 번호와 불일치한 번호는 빨간 행으로 표시한다. 모든 행이 확인되면 `onConfirm`을 호출한다.

- [ ] **Step 4: ReportGenerator 상태 흐름 연결**

상태를 다음으로 추가한다.

```ts
type AnalysisState = "idle" | "analyzing" | "review" | "confirmed" | "error";
const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
const [analysis, setAnalysis] = useState<DocumentAnalysisResponse | null>(null);
const [isGenerating, setIsGenerating] = useState(false);
```

`자료 분석`은 FormData를 만들어 `/api/parse-documents`에 전송한다. `교과평어 생성`은 확인된 번호·단계, 추출 참고 텍스트, 예시문, 지시사항과 비밀번호만 `/api/generate-report`에 JSON으로 전송한다. 이름은 요청 객체를 만드는 코드 경로에 넣지 않는다.

응답은 `studentNumber`로 현재 `rows`를 찾아 평가결과와 종합의견을 갱신한다. 분석 파일이나 영역 수가 바뀌면 확인 상태를 `idle`로 되돌린다.

- [ ] **Step 5: 로딩·오류·비활성화 스타일 추가**

파스텔 업무형 색상을 유지하며 분석 중 버튼, 검토 필요 배지, 오류 행, 완료 배지를 추가한다. 애니메이션은 넣지 않는다.

- [ ] **Step 6: 통합 UI 테스트 작성**

fetch를 분석 응답과 생성 응답 순서로 모의하고 다음을 검사한다: 분석 전 생성 차단, 분석 결과 수정, 확인 후 번호만 생성 요청에 포함, 이름 없음, 응답이 해당 학생 textarea에 반영, 30,000원 제한 시 버튼 비활성화.

- [ ] **Step 7: 대상 테스트 통과 확인**

Run: `pnpm test:run -- tests/document-review-panel.test.tsx tests/report-generator.test.tsx`

Expected: PASS.

### Task 12: 로컬 환경 파일과 데이터베이스 준비

**Files:**
- Create: `.env.example`
- Modify: `README.md`
- Modify: `README_HANDOFF.md`

- [ ] **Step 1: 값 없는 환경변수 예시 작성**

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
MONTHLY_BUDGET_KRW=30000
USD_KRW_RATE=1400
INPUT_PRICE_PER_1M_USD=0.40
OUTPUT_PRICE_PER_1M_USD=1.60
TEACHER_ACCESS_PASSWORD=change-this-password
DATABASE_URL=postgresql://record_helper:change-this-password@127.0.0.1:5432/record_helper
```

- [ ] **Step 2: 사용자에게 API 키 입력 시점 안내**

이 단계에서만 사용자에게 `.worktrees/report-generator-ui/.env.local`을 직접 만들고 `OPENAI_API_KEY`를 붙여 넣도록 안내한다. 키를 채팅, README, 스크린샷 또는 터미널 출력으로 받지 않는다.

- [ ] **Step 3: 로컬 PostgreSQL 데이터베이스 생성**

사용자가 정한 로컬 DB 비밀번호로 역할과 DB를 만든다. 명령에 실제 비밀번호를 출력하지 않고 `psql` 대화형 입력 또는 사용자가 직접 편집한 `.env.local`을 사용한다.

Run:

```bash
pnpm prisma migrate dev --name init_usage
```

Expected: `UsageEvent` 테이블 생성 성공.

- [ ] **Step 4: README 보안·실행 절차 작성**

반드시 다음을 명시한다: 서버는 `pnpm dev -- --hostname 127.0.0.1`, 키는 `.env.local`, OpenAI에는 익명화된 자료가 전송됨, 원본·이름·결과는 저장하지 않음, 로컬 PostgreSQL에는 사용량만 저장, OpenAI 프로젝트 예산도 별도 설정, DRM·스캔 문서 미지원.

### Task 13: 전체 보안·품질 검증

**Files:**
- Modify: 구현 파일 only if verification exposes a defect

- [ ] **Step 1: 이름·키 누출 정적 검사**

Run:

```bash
rg -n "OPENAI_API_KEY|NEXT_PUBLIC_OPENAI|console\.(log|error)|name:" app lib components
```

Expected: API 키는 `lib/server-config.ts`의 `process.env.OPENAI_API_KEY` 참조만 존재하고 `NEXT_PUBLIC_OPENAI`는 0건. 로그는 민감하지 않은 고정 오류 코드만 허용. 생성 요청 타입과 프롬프트에 `name` 필드 0건.

- [ ] **Step 2: 전체 타입·테스트·빌드**

Run:

```bash
pnpm typecheck
pnpm test:run
pnpm build
```

Expected: 모두 exit 0, 테스트 실패 0건.

- [ ] **Step 3: 실제 합성 문서 수동 검증**

개인정보 없는 합성 PDF, HWP, HWPX를 각각 등록해 추출 표가 번호·단계를 표시하는지 확인한다. 실제 학교 문서 검증은 사용자가 직접 선택하며 파일을 저장소나 로그에 남기지 않는다.

- [ ] **Step 4: 브라우저 핵심 흐름 검증**

`127.0.0.1:3000`에서 문서 등록 → 분석 → 단계 수정 → 확인 → 생성 → 결과 수정 → 복사 → CSV까지 확인한다. 콘솔 오류와 Next 오류 오버레이가 없어야 한다.

- [ ] **Step 5: 월 한도 검증**

테스트 DB에 합계 27,000원과 30,000원 사용량을 각각 만들어 경고와 생성 차단을 확인한 뒤 해당 합성 사용량 행을 제거한다. 실제 학생 데이터는 사용하지 않는다.

---

## Execution checkpoints

- Task 1~5 완료: 문서 분석 API와 UI 이전 기반 검토
- Task 6~10 완료: 보안·OpenAI·사용량 서버 검토
- Task 11~12 완료: 전체 UI와 로컬 환경 설정 검토
- Task 13 완료: 최종 검증 후 `ce-compound`로 실수·원인·재사용 교훈 문서화
