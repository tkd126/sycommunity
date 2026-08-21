# Navigation, Analysis Progress, Report Copy, and Creative Activity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove misleading inactive navigation, expose the existing creative-activity workflow, report truthful attachment-analysis progress, and generate longer, more concrete subject comments.

**Architecture:** Keep the current App Router and authenticated API boundaries. Add an optional NDJSON progress mode to the existing document parser while preserving its JSON response for compatibility, and consume that stream in `ReportGenerator`. Reuse the existing creative-activity component and APIs by wiring them into `AppShell` rather than rebuilding them.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, Zod, Tailwind/CSS.

## Global Constraints

- Student names and uploaded source documents must not be persisted in the database.
- OpenAI and authentication secrets remain server-only environment variables.
- Subject comments contain exactly one sentence per selected area and preserve the achievement-level-first balancing rule.
- Creative activity extraction includes 창체/자율/봉사/진로 and excludes 동아리.
- No Git commit or remote operation is part of this local implementation cycle.

---

### Task 1: Connect only working navigation destinations

**Files:**
- Modify: `components/AppShell.tsx`
- Modify: `components/Sidebar.tsx`
- Modify: `app/page.tsx`
- Test: `tests/app-shell.test.tsx`

**Interfaces:**
- `AppShellProps.creative?: ReactNode` supplies the authenticated creative activity page.
- Top menu label `창체활동` selects `creative`.

- [ ] Add failing tests that expect `창체활동` to render the creative node and assert inactive sidebar labels are absent.
- [ ] Run `pnpm test:run tests/app-shell.test.tsx` and confirm the new assertions fail.
- [ ] Replace `행동특성` with `창체활동`, add the creative content branch, remove inactive sidebar leaves, and pass `CreativeActivityGenerator` from `app/page.tsx` through `AuthGate`.
- [ ] Run the focused test and confirm it passes.

### Task 2: Stream truthful document-analysis progress

**Files:**
- Modify: `app/api/parse-documents/route.ts`
- Modify: `components/ReportGenerator.tsx`
- Test: `tests/api/parse-documents.test.ts`
- Test: `tests/report-generator.test.tsx`

**Interfaces:**
- A request with `Accept: application/x-ndjson` receives newline-delimited events.
- Progress event: `{ type: "progress", percent: number, completedFiles: number, totalFiles: number, stage: string }`.
- Terminal event: `{ type: "result", status: number, data: DocumentAnalysisResponse | ApiError }`.
- Requests without that header retain the existing JSON response.

- [ ] Add an API test that records progress callbacks/events and expects monotonic file counts followed by 100% and a result.
- [ ] Add a component test that feeds NDJSON chunks and expects `분석 중 67% · 4/6개 파일` before completion.
- [ ] Run both focused tests and confirm failure is caused by missing progress support.
- [ ] Add an optional progress reporter to `handleParseDocuments`, count completed area/reference files, and implement the NDJSON `POST` response path without serializing the existing parallel file reads.
- [ ] Add a small NDJSON response reader in `ReportGenerator`, update percent/file count as events arrive, and clear the analyzing state immediately after rows are committed.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Make subject comments longer and concrete

**Files:**
- Modify: `lib/prompt.ts`
- Test: `tests/prompt.test.ts`

**Interfaces:**
- The system prompt requires 55–100 Korean characters per selected area sentence as a target, not a hard response rejection rule.
- The prompt forbids objectless stock phrases and supplies concrete before/after examples.

- [ ] Add failing prompt assertions for `55자에서 100자`, concrete learning objects/actions, and the disallowed phrases `기본적인 이해를 보임` and objectless `잘 설명함`.
- [ ] Run `pnpm test:run tests/prompt.test.ts` and confirm the new assertions fail.
- [ ] Update the prompt while preserving exact area count, nominal endings, sanitization, positivity, and level-priority balancing requirements.
- [ ] Run the focused prompt test and confirm it passes.

### Task 4: Verify the creative activity workflow against the approved format

**Files:**
- Modify only if needed: `components/CreativeActivityGenerator.tsx`
- Modify only if needed: `lib/creative-activity-openai.ts`
- Test: `tests/creative-activity-generator.test.tsx`
- Test: `tests/api/creative-activities.test.ts`

**Interfaces:**
- Input accepts HWP/HWPX/PDF annual timetables.
- Extraction keeps separate rows for multiple activities on the same date.
- Final output shows only `날짜` and `평어` columns.

- [ ] Extend tests to assert the connected UI copy, supported categories, club exclusion, duplicate-date separate rows, and two-column final output.
- [ ] Run focused creative-activity tests and confirm whether any approved behavior is missing.
- [ ] Make only the minimal changes required by failing tests; do not replace the existing parsing/generation APIs.
- [ ] Re-run focused tests.

### Task 5: Full verification and browser QA

**Files:**
- Create: `docs/solutions/ui-streaming/document-analysis-progress-and-disconnected-navigation.md`

- [ ] Run `pnpm test:run` and record the passing/failing totals.
- [ ] Run `pnpm typecheck` and fix all errors introduced by this work.
- [ ] Run `pnpm build` and confirm the production build succeeds.
- [ ] Start or reuse the local Node 24 development server and verify `http://127.0.0.1:3000` returns HTTP 200.
- [ ] Use the in-app browser to confirm navigation, progress UI, report generation controls, and creative activity screen layout.
- [ ] Apply `ce-compound` in lightweight mode to document the reusable lesson: expose only wired navigation and drive progress from completed work units rather than elapsed-time simulation.
