---
title: Run Prisma migrations before Vercel production builds
date: 2026-08-21
category: database-issues
module: Vercel deployment
problem_type: database_issue
component: database
symptoms:
  - "A fresh hosted PostgreSQL database has no application tables"
  - "Authentication and saved-report routes require Prisma tables at runtime"
root_cause: missing_workflow_step
resolution_type: migration
severity: high
tags: [vercel, prisma, postgresql, deployment]
---

# Run Prisma migrations before Vercel production builds

## Problem

A new Neon PostgreSQL database connected to Vercel starts without the tables required by authentication, approvals, usage records, and saved reports. A successful Next.js build alone does not create those tables.

## Symptoms

- A fresh hosted PostgreSQL database has no application tables.
- Authentication and saved-report routes require Prisma tables at runtime.

## What Didn't Work

- Relying on `next build` alone: it compiles the application but does not apply the Prisma schema to PostgreSQL.
- Using an untracked local `db push`: it does not provide a repeatable deployment history.

## Solution

Commit the generated initial migration under `prisma/migrations/` and use a Vercel-only build command:

```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

This leaves the ordinary local `build` script as `next build`, while every Vercel preview or production build applies only tracked migrations through `prisma migrate deploy`.

## Why This Works

`prisma migrate deploy` reads the committed migration history and applies any unapplied migration to the `DATABASE_URL` supplied by the Vercel Neon integration. It is repeatable: an already-applied migration is skipped instead of being recreated.

## Prevention

- For every schema change, create and commit a Prisma migration before deploying.
- Keep `DATABASE_URL` server-only in Vercel and never put it in a public environment variable.
- Verify both `prisma validate` and the production build before promoting a preview deployment.

## Related Issues

- The Vercel project must have the Neon integration enabled for its Production and Preview environments.
