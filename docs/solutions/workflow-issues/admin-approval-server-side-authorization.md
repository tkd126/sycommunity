---
title: "Admin approval must be enforced by server-side authorization"
date: "2026-07-09"
category: "workflow-issues"
problem_type: "security_issue"
component: "admin-approval"
tags:
  - "next-auth"
  - "admin-approval"
  - "server-authorization"
---

# Admin approval must be enforced by server-side authorization

## Problem

The app needed a teacher-friendly way to approve Google login users without opening pgAdmin. The risky shortcut would have been to only hide or show an approval panel in the browser.

## Root Cause

UI-only access control is not enough. A non-admin user can still attempt to call API routes directly if server routes do not independently check the session and role.

## Solution

Add a dedicated admin authorization layer and require it in every admin API route.

- `requireAdmin()` first checks that the user is logged in and `subscriptionStatus` is `active`.
- It then checks that `role` is `admin`.
- `/api/admin/users` lists users only after `requireAdmin()` succeeds.
- `/api/admin/users/[id]` updates `role` or `subscriptionStatus` only after `requireAdmin()` succeeds.
- The settings UI can show the approval panel, but the server remains the source of truth.

## Verification

The feature was verified with focused API and UI tests:

- Non-admin users receive `ADMIN_REQUIRED`.
- Admin users can list pending accounts.
- Admin users can approve a pending teacher.
- Invalid role updates are rejected.
- The settings tab switches from the report generator to the admin approval panel.

The full Next build initially failed inside the Codex sandbox with `EPERM: operation not permitted, lstat 'C:\Users\tkddb'`. Rerunning the same build with approval succeeded, confirming it was a sandbox permission issue rather than an application build error.

## Prevention

For future admin features, do not rely on menu visibility or client-side checks. Add a server-side authorization helper first, test denial before success, and only then attach the UI.
