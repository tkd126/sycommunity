# Anonymous Saved Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each approved Google account save and reload generated subject comments without storing student real names or uploaded source files.

**Architecture:** Store report snapshots in PostgreSQL with `userId` ownership and anonymized row data only. Server routes enforce active subscription and user ownership. The UI adds save/load/delete controls in the report generator.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, NextAuth, React, Vitest.

## Global Constraints

- Student real names must not be stored in the database.
- Uploaded PDF/HWP/HWPX files must not be stored.
- Saved reports are owned by the logged-in user and are not visible to other teachers.
- Admin approval is not a substitute for saved-report ownership checks.

---

### Task 1: Database models and API

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `app/api/saved-reports/route.ts`
- Create: `app/api/saved-reports/[id]/route.ts`
- Test: `tests/api/saved-reports.test.ts`

**Interfaces:**
- `GET /api/saved-reports`
- `POST /api/saved-reports`
- `GET /api/saved-reports/[id]`
- `DELETE /api/saved-reports/[id]`

- [ ] Add `SavedReport` and `SavedReportRow`.
- [ ] Test and implement create/list/get/delete route handlers.
- [ ] Enforce `userId` ownership on every route.
- [ ] Validate rows contain anonymous fields only.

### Task 2: Report generator save/load UI

**Files:**
- Modify: `components/ReportGenerator.tsx`
- Test: `tests/report-generator-saved-reports.test.tsx`

**Interfaces:**
- Consumes saved-report APIs from Task 1.

- [ ] Add 저장하기, 저장본 선택, 불러오기, 삭제 buttons.
- [ ] Save current table rows as anonymized rows.
- [ ] Load saved rows back into the current subject table.
- [ ] Show privacy 안내 that real names and files are not stored.
