# Admin Approval Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a settings-screen administrator approval panel so only admin users can approve, suspend, and role-change Google login users.

**Architecture:** Server-side admin authorization is enforced in dedicated admin API routes. The UI only presents the settings panel, but the API remains the source of truth. Existing teacher password and OpenAI usage controls remain unchanged.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, NextAuth, React client components, Vitest.

## Global Constraints

- Only `role = admin` users can access admin user APIs.
- User approval changes update only `User.subscriptionStatus` and `User.role`.
- Student names, uploaded assessment content, and generated comments must not be stored for this feature.
- Existing teacher password flow remains in place for now.

---

### Task 1: Admin authorization and API

**Files:**
- Modify: `lib/authz.ts`
- Create: `app/api/admin/users/route.ts`
- Create: `app/api/admin/users/[id]/route.ts`
- Test: `tests/api/admin-users.test.ts`

**Interfaces:**
- Produces: `requireAdmin()`
- Produces: `handleListAdminUsers(dependencies)`
- Produces: `handleUpdateAdminUser(request, context, dependencies)`

- [ ] Write failing API tests for non-admin denial, admin listing, and admin updating.
- [ ] Implement `requireAdmin`.
- [ ] Implement list and update route handlers.
- [ ] Run targeted API tests.

### Task 2: Settings UI

**Files:**
- Modify: `components/AppShell.tsx`
- Create: `components/AdminApprovalPanel.tsx`
- Modify: `app/page.tsx`
- Test: `tests/app-shell.test.tsx`

**Interfaces:**
- Consumes: `/api/admin/users`
- Consumes: `/api/admin/users/[id]`

- [ ] Add settings menu rendering path.
- [ ] Add administrator approval table.
- [ ] Keep admin actions dependent on server API responses.
- [ ] Run component tests and typecheck.
