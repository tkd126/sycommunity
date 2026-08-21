# Report Generator Performance and Session Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce report generation and refresh latency, restore anonymous report work across refreshes, and remove desktop horizontal table scrolling.

**Architecture:** Serialize only privacy-safe report UI state into versioned `sessionStorage`. Keep one OpenAI request per generation while reducing repeated reference context and sizing output tokens to the requested row count. Defer saved-report network loading and make the subject table consume the available width.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, CSS.

## Global Constraints

- Never store source files, teacher passwords, or student real names in browser storage.
- Session data must disappear when the browser tab session ends.
- Keep one OpenAI request per user generation action to respect cost and request-rate limits.
- Preserve editable generated comments and all existing generation rules.

---

### Task 1: Versioned Anonymous Workspace Session

**Files:**
- Modify: `components/ReportGenerator.tsx`
- Test: `tests/report-generator.test.tsx`

**Interfaces:**
- Produces: `ReportGeneratorSessionState` validation and versioned session persistence.
- Consumes: `readSessionValue` and `writeSessionValue` from `lib/session-storage.ts`.

- [ ] Write a failing test that generates rows, edits a comment and settings, unmounts, rerenders, and expects the anonymous state to be restored.
- [ ] Write a failing test asserting stored JSON contains neither password nor uploaded file names nor real names.
- [ ] Run `vitest run tests/report-generator.test.tsx` and confirm the new tests fail.
- [ ] Initialize subject workspaces and writing settings from the versioned session envelope and persist safe state changes with an effect.
- [ ] Run the focused test and confirm it passes.

### Task 2: Smaller Generation Request

**Files:**
- Modify: `lib/openai.ts`
- Modify: `lib/prompt.ts`
- Test: `tests/api/generate-report.test.ts`
- Test: `tests/prompt.test.ts`

**Interfaces:**
- Produces: `getReportOutputTokenLimit(studentCount: number): number`.
- Consumes: the existing single Responses API request.

- [ ] Write failing tests proving one-student requests use a smaller output limit and 27-student requests stay within the server cap.
- [ ] Write a failing prompt test proving reference sections are bounded without removing student evidence or rules.
- [ ] Run the focused tests and confirm failure.
- [ ] Add request-size-aware output token calculation and deterministic reference-text compaction.
- [ ] Run the focused tests and confirm success.

### Task 3: Deferred Initial Network Work

**Files:**
- Modify: `components/ReportGenerator.tsx`
- Test: `tests/report-generator-saved-reports.test.tsx`

**Interfaces:**
- Produces: explicit `loadSavedReports()` invoked only by saved-report controls.

- [ ] Write a failing test that initial render calls usage but does not call `/api/saved-reports`.
- [ ] Run the test and confirm failure.
- [ ] Remove mount-time saved-report loading and load on the existing refresh/open action.
- [ ] Run saved-report tests and confirm success.

### Task 4: Fit Subject Results Without Horizontal Scrolling

**Files:**
- Modify: `app/globals.css`
- Test: `tests/report-generator.test.tsx`

**Interfaces:**
- Produces: semantic table class rules that fit within the workspace.

- [ ] Write a failing class/style contract test for the subject result table.
- [ ] Run the test and confirm failure.
- [ ] Change subject table sizing to 100% and reduce fixed column widths while keeping the comment column flexible.
- [ ] Run report-generator tests and confirm success.

### Task 5: Verification

**Files:**
- Verify all modified files.

- [ ] Run focused tests for report generator, prompt, OpenAI, session storage, and saved reports.
- [ ] Run the full test suite.
- [ ] Run TypeScript checking and report any pre-existing failures separately.
- [ ] Confirm `http://127.0.0.1:3000` responds and manually verify refresh restoration without storing source files or password.
