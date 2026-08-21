# Club Activity Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a club activity record writer UI that creates editable, anonymized, noun-ending dummy activity records without calling OpenAI.

**Architecture:** Add a small pure helper for club activity wording rules, a client component for the club UI, and route the existing top menu/sidebar to show the new component. The helper keeps product/proper-name generalization testable outside React.

**Tech Stack:** Next.js App Router, TypeScript, React, Vitest, Testing Library, existing CSS.

## Global Constraints

- Do not call OpenAI for this step.
- Do not store student real names.
- Product names, trademarks, and specific idol/group names should be generalized.
- Club records should end in noun-style Korean endings such as `함.`, `제작함.`, `발표함.`
- Do not include qualitative evaluation in club activity records.
- Keep the existing Google login and approved-user gate behavior intact.

---

### Task 1: Club wording helper

**Files:**
- Create: `lib/club-record.ts`
- Test: `tests/club-record.test.ts`

**Interfaces:**
- Produces: `generateClubActivityRecord(note: string): string`
- Produces: `sanitizeClubActivityText(text: string): string`

- [x] **Step 1: Write failing tests**

Test product name replacement, qualitative-word removal, and noun-ending output.

- [x] **Step 2: Verify the tests fail**

Run: `node .\node_modules\vitest\vitest.mjs run tests\club-record.test.ts --pool=vmThreads --reporter=dot`

- [x] **Step 3: Implement minimal helper**

Create replacement maps and simple activity pattern rules.

- [x] **Step 4: Verify the tests pass**

Run the same Vitest command and confirm green.

---

### Task 2: Club activity UI

**Files:**
- Create: `components/ClubActivityGenerator.tsx`
- Test: `tests/club-activity-generator.test.tsx`

**Interfaces:**
- Consumes: `generateClubActivityRecord(note: string): string`
- Produces: an editable table with rows `{ selected, number, anonymousName, activityMemo, record }`

- [x] **Step 1: Write failing UI test**

Render the component, type a club memo, click generate, and assert the generated record is generalized and editable.

- [x] **Step 2: Verify the test fails**

Run: `node .\node_modules\vitest\vitest.mjs run tests\club-activity-generator.test.tsx --pool=vmThreads --reporter=dot`

- [x] **Step 3: Implement minimal UI**

Build the table, buttons, copy/download helpers, row add/delete/reset, and privacy/rule notices.

- [x] **Step 4: Verify the UI test passes**

Run the same Vitest command and confirm green.

---

### Task 3: Navigation integration

**Files:**
- Modify: `components/AppShell.tsx`
- Modify: `components/Sidebar.tsx`
- Modify: `app/page.tsx`
- Test: `tests/app-shell.test.tsx`

**Interfaces:**
- `AppShell` accepts `club?: ReactNode` and renders it when `동아리활동` is selected.

- [x] **Step 1: Write/update failing navigation test**

Assert top menu includes `동아리활동`, does not include `출결자료`, and shows club content when clicked.

- [x] **Step 2: Implement navigation changes**

Wire `AppShell`, `Sidebar`, and `app/page.tsx`.

- [x] **Step 3: Verify all related tests pass**

Run club helper/UI tests plus app shell test.

---

### Task 4: Final verification

**Files:**
- No production files unless fixing verification failures.

- [x] **Step 1: Run TypeScript check**

Run: `node .\node_modules\typescript\bin\tsc --noEmit`

- [x] **Step 2: Run focused Vitest tests**

Run all newly affected tests.

- [x] **Step 3: If needed, restart or confirm dev server**

Use `서버실행.ps1` if the browser cannot connect.
