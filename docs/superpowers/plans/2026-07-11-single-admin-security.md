# Single Administrator Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make one server-configured Google account the only administrator and remove every application path that can promote another account.

**Architecture:** A server-only email helper normalizes and validates `ADMIN_EMAIL`. Session roles use it only for display, while `requireAdmin()` independently enforces it for every administrator API request. The administrator update API accepts subscription changes only, protects the owner account, and the UI hides administrator controls from teachers.

**Tech Stack:** Next.js App Router 16, TypeScript, NextAuth 4, Prisma 6, Zod 4, React 19, Vitest, Testing Library

## Global Constraints

- Exactly one administrator is allowed.
- The real administrator email must exist only in `.env.local` or deployment environment variables.
- `ADMIN_EMAIL` must never use a `NEXT_PUBLIC_` prefix.
- Email comparison trims whitespace and uses lowercase.
- Server authorization must never trust the client session role or the database `User.role` value alone.
- Uploaded student files, student names, and generated comments remain outside authentication logs.
- Existing unrelated working-tree changes must not be reverted or staged.

---

### Task 1: Server-owned administrator identity

**Files:**
- Create: `lib/admin-identity.ts`
- Create: `tests/admin-identity.test.ts`
- Modify: `lib/authz.ts`
- Create: `tests/authz.test.ts`
- Modify: `lib/auth-options.ts`

**Interfaces:**
- Produces: `normalizeEmail(email: string): string`
- Produces: `readAdminEmail(env: Record<string, string | undefined>): string`
- Produces: `isAdminEmail(email: string | null | undefined, env: Record<string, string | undefined>): boolean`
- Produces: `evaluateAdminAccess(active: AccessCheckResult, env: Record<string, string | undefined>): AccessCheckResult`
- Consumes: the existing `requireActiveSubscription()` result and `process.env`

- [ ] **Step 1: Write failing administrator identity tests**

Create `tests/admin-identity.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { isAdminEmail, normalizeEmail, readAdminEmail } from "@/lib/admin-identity";

describe("administrator identity", () => {
  it("normalizes whitespace and email case", () => {
    expect(normalizeEmail("  Owner@Example.com ")).toBe("owner@example.com");
  });

  it("reads one valid administrator email", () => {
    expect(readAdminEmail({ ADMIN_EMAIL: " Owner@Example.com " })).toBe("owner@example.com");
  });

  it("rejects missing and invalid administrator settings", () => {
    expect(() => readAdminEmail({})).toThrow("ADMIN_EMAIL");
    expect(() => readAdminEmail({ ADMIN_EMAIL: "not-an-email" })).toThrow("ADMIN_EMAIL");
  });

  it("fails closed when the setting is invalid", () => {
    expect(isAdminEmail("owner@example.com", {})).toBe(false);
    expect(isAdminEmail("owner@example.com", { ADMIN_EMAIL: "not-an-email" })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the identity tests and verify they fail**

Run:

```powershell
& 'C:\Users\tkddb\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\vitest\vitest.mjs run .\tests\admin-identity.test.ts --pool=vmThreads --reporter=dot
```

Expected: FAIL because `@/lib/admin-identity` does not exist.

- [ ] **Step 3: Implement the server-only identity helper**

Create `lib/admin-identity.ts`:

```ts
import { z } from "zod";

const adminEmailSchema = z.string().trim().toLowerCase().email();

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function readAdminEmail(env: Record<string, string | undefined>): string {
  const parsed = adminEmailSchema.safeParse(env.ADMIN_EMAIL);
  if (!parsed.success) throw new Error("ADMIN_EMAIL 환경변수를 확인해 주세요.");
  return parsed.data;
}

export function isAdminEmail(
  email: string | null | undefined,
  env: Record<string, string | undefined>,
): boolean {
  if (!email) return false;
  try {
    return normalizeEmail(email) === readAdminEmail(env);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run the identity tests and verify they pass**

Run the command from Step 2.

Expected: 1 test file and 4 tests PASS.

- [ ] **Step 5: Write failing server authorization tests**

Create `tests/authz.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { evaluateAdminAccess, type AccessCheckResult } from "@/lib/authz";

const active = (email: string, role: "teacher" | "admin" = "teacher"): AccessCheckResult => ({
  ok: true,
  userId: "user-1",
  email,
  role,
});

describe("evaluateAdminAccess", () => {
  it("allows the configured owner regardless of stored display role", () => {
    expect(evaluateAdminAccess(active("Owner@Example.com"), { ADMIN_EMAIL: "owner@example.com" })).toMatchObject({ ok: true });
  });

  it("rejects a non-owner even when the database role says admin", () => {
    expect(evaluateAdminAccess(active("other@example.com", "admin"), { ADMIN_EMAIL: "owner@example.com" })).toMatchObject({
      ok: false,
      status: 403,
      code: "ADMIN_REQUIRED",
    });
  });

  it("returns a server configuration error when ADMIN_EMAIL is invalid", () => {
    expect(evaluateAdminAccess(active("owner@example.com"), {})).toMatchObject({
      ok: false,
      status: 500,
      code: "SERVER_CONFIG_ERROR",
    });
  });
});
```

- [ ] **Step 6: Run the authorization tests and verify they fail**

Run:

```powershell
& 'C:\Users\tkddb\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\vitest\vitest.mjs run .\tests\authz.test.ts --pool=vmThreads --reporter=dot
```

Expected: FAIL because `evaluateAdminAccess` is not exported.

- [ ] **Step 7: Enforce the configured email in server authorization**

Modify `lib/authz.ts` so the failure status includes `500`, add a pure evaluator, and delegate `requireAdmin()` to it:

```ts
import { readAdminEmail, normalizeEmail } from "@/lib/admin-identity";

export type AccessCheckResult =
  | { ok: true; userId: string; email: string | null; role: "teacher" | "admin" }
  | { ok: false; status: 401 | 403 | 500; code: string; message: string };

export function evaluateAdminAccess(
  active: AccessCheckResult,
  env: Record<string, string | undefined>,
): AccessCheckResult {
  if (!active.ok) return active;

  let adminEmail: string;
  try {
    adminEmail = readAdminEmail(env);
  } catch {
    return {
      ok: false,
      status: 500,
      code: "SERVER_CONFIG_ERROR",
      message: "관리자 환경설정을 확인해 주세요.",
    };
  }

  if (!active.email || normalizeEmail(active.email) !== adminEmail) {
    return {
      ok: false,
      status: 403,
      code: "ADMIN_REQUIRED",
      message: "관리자만 이용할 수 있습니다.",
    };
  }

  return { ...active, role: "admin" };
}

export async function requireAdmin(): Promise<AccessCheckResult> {
  return evaluateAdminAccess(await requireActiveSubscription(), process.env);
}
```

- [ ] **Step 8: Derive the client display role from the same owner identity**

Modify the session callback in `lib/auth-options.ts`:

```ts
import { isAdminEmail } from "@/lib/admin-identity";

session.user.role = isAdminEmail(user.email, process.env) ? "admin" : "teacher";
```

Keep `session.user.subscriptionStatus = user.subscriptionStatus`. Do not expose `ADMIN_EMAIL` itself to the client.

- [ ] **Step 9: Run focused tests and type checking**

Run:

```powershell
& 'C:\Users\tkddb\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\vitest\vitest.mjs run .\tests\admin-identity.test.ts .\tests\authz.test.ts --pool=vmThreads --reporter=dot
& 'C:\Users\tkddb\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\typescript\bin\tsc --noEmit
```

Expected: focused tests PASS and TypeScript exits with code 0.

- [ ] **Step 10: Commit only Task 1 files**

```powershell
git add lib/admin-identity.ts lib/authz.ts lib/auth-options.ts tests/admin-identity.test.ts tests/authz.test.ts
git commit -m "security: enforce one configured administrator"
```

---

### Task 2: Remove role mutation and protect the owner account

**Files:**
- Modify: `app/api/admin/users/route.ts`
- Modify: `app/api/admin/users/[id]/route.ts`
- Modify: `tests/api/admin-users.test.ts`

**Interfaces:**
- Consumes: `requireAdmin()` returning the immutable owner `userId`
- Produces: admin list records with `protected: boolean`
- Produces: PATCH accepting exactly `{ subscriptionStatus: "pending" | "active" | "suspended" | "expired" }`

- [ ] **Step 1: Add failing API invariant tests**

Extend `tests/api/admin-users.test.ts` with these cases:

```ts
it("rejects every role mutation even when the role value is valid", async () => {
  const updateUser = vi.fn();
  const response = await handleUpdateAdminUser(
    new Request("http://localhost/api/admin/users/user-1", {
      method: "PATCH",
      body: JSON.stringify({ role: "admin" }),
    }),
    { params: Promise.resolve({ id: "user-1" }) },
    { requireAdmin: adminAccess, updateUser },
  );

  expect(response.status).toBe(400);
  expect(updateUser).not.toHaveBeenCalled();
});

it("rejects changes to the owner account", async () => {
  const updateUser = vi.fn();
  const response = await handleUpdateAdminUser(
    new Request("http://localhost/api/admin/users/admin-1", {
      method: "PATCH",
      body: JSON.stringify({ subscriptionStatus: "suspended" }),
    }),
    { params: Promise.resolve({ id: "admin-1" }) },
    { requireAdmin: adminAccess, updateUser },
  );

  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({ code: "OWNER_ACCOUNT_PROTECTED" });
  expect(updateUser).not.toHaveBeenCalled();
});
```

Update the list assertion to expect `protected: false` for `user-1`, and add an owner record assertion expecting `protected: true` for `admin-1`.

- [ ] **Step 2: Run the API tests and verify they fail**

Run:

```powershell
& 'C:\Users\tkddb\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\vitest\vitest.mjs run .\tests\api\admin-users.test.ts --pool=vmThreads --reporter=dot
```

Expected: FAIL because valid `role=admin` is accepted, the owner is mutable, and `protected` is missing.

- [ ] **Step 3: Make the PATCH schema strict and subscription-only**

Replace the update schema in `app/api/admin/users/[id]/route.ts`:

```ts
const updateUserSchema = z.object({
  subscriptionStatus: z.enum(["pending", "active", "suspended", "expired"]),
}).strict();
```

After resolving `params`, reject `params.id === access.userId` before calling `updateUser`:

```ts
if (params.id === access.userId) {
  return NextResponse.json(
    { code: "OWNER_ACCOUNT_PROTECTED", message: "관리자 본인의 상태는 변경할 수 없습니다." },
    { status: 403 },
  );
}
```

Remove `role` from `AdminUserPatch` and the Prisma update select if it is no longer returned by this endpoint.

- [ ] **Step 4: Mark the owner in list responses**

Change `serializeUser` in `app/api/admin/users/route.ts` to accept the owner ID:

```ts
function serializeUser(user: AdminUserRecord, ownerId: string) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    subscriptionStatus: user.subscriptionStatus,
    protected: user.id === ownerId,
    createdAt: user.createdAt.toISOString(),
  };
}
```

Map with `serializeUser(user, access.userId)` and remove `role` from the list select and response type.

- [ ] **Step 5: Run the API tests and type checking**

Run the Task 2 Step 2 command, then run TypeScript as in Task 1 Step 9.

Expected: admin API tests PASS and TypeScript exits with code 0.

- [ ] **Step 6: Commit only Task 2 files**

```powershell
git add app/api/admin/users/route.ts app/api/admin/users/[id]/route.ts tests/api/admin-users.test.ts
git commit -m "security: block administrator role mutation"
```

---

### Task 3: Hide administrator UI and remove promotion controls

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/AppShell.tsx`
- Modify: `components/AdminApprovalPanel.tsx`
- Modify: `tests/app-shell.test.tsx`
- Modify: `tests/admin-approval-panel.test.tsx`

**Interfaces:**
- Consumes: server session `session.user.role`
- Produces: `AppShell` prop `showSettings?: boolean`
- Consumes: admin API user field `protected: boolean`

- [ ] **Step 1: Write failing settings visibility tests**

Add to `tests/app-shell.test.tsx`:

```tsx
it("hides Settings from a teacher", () => {
  render(<AppShell showSettings={false}><div>업무 내용</div></AppShell>);
  expect(screen.queryByRole("button", { name: "설정" })).not.toBeInTheDocument();
});

it("shows Settings to the configured administrator", () => {
  render(<AppShell showSettings settings={<div>관리자 승인 화면</div>}><div>업무 내용</div></AppShell>);
  expect(screen.getByRole("button", { name: "설정" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Write failing admin panel control tests**

Update the API fixture in `tests/admin-approval-panel.test.tsx` to use `protected: false` and no `role`. Add assertions:

```tsx
expect(screen.queryByRole("button", { name: "관리자로 변경" })).not.toBeInTheDocument();
expect(screen.queryByRole("button", { name: "교사로 변경" })).not.toBeInTheDocument();
```

Add a protected owner fixture and assert its status buttons are disabled and the text `보호 계정` is visible.

- [ ] **Step 3: Run the UI tests and verify they fail**

Run:

```powershell
& 'C:\Users\tkddb\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\vitest\vitest.mjs run .\tests\app-shell.test.tsx .\tests\admin-approval-panel.test.tsx --pool=vmThreads --reporter=dot
```

Expected: FAIL because `showSettings` and `protected` are not implemented and role buttons still exist.

- [ ] **Step 4: Add server-derived settings visibility**

Modify `app/page.tsx` into an async server component:

```tsx
import { getServerSession } from "next-auth";

import { AdminApprovalPanel } from "@/components/AdminApprovalPanel";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { ClubActivityGenerator } from "@/components/ClubActivityGenerator";
import { ReportGenerator } from "@/components/ReportGenerator";
import { authOptions } from "@/lib/auth-options";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const showSettings = session?.user?.role === "admin" && session.user.subscriptionStatus === "active";

  return (
    <AppShell
      showSettings={showSettings}
      club={(
        <AuthGate>
          <ClubActivityGenerator />
        </AuthGate>
      )}
      settings={(
        <AuthGate>
          <AdminApprovalPanel />
        </AuthGate>
      )}
    >
      <AuthGate>
        <ReportGenerator />
      </AuthGate>
    </AppShell>
  );
}
```

Keep the existing `AuthGate`, report generator, and club generator content unchanged.

- [ ] **Step 5: Filter the Settings menu inside AppShell**

Add `showSettings?: boolean` to `AppShellProps`. Build `visibleTopMenus` from `topMenus` and render `설정` only when `showSettings` is true. If settings are hidden, the initial and fallback menu remains `교과평어`.

- [ ] **Step 6: Remove role controls and protect the owner row**

Change the `AdminUser` type in `components/AdminApprovalPanel.tsx`:

```ts
type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;
  subscriptionStatus: "pending" | "active" | "suspended" | "expired";
  protected: boolean;
  createdAt: string;
};
```

Remove the role labels, role column, and role-changing buttons. For a protected row, display `보호 계정` and disable all subscription buttons. Keep approval and suspension controls for other accounts.

- [ ] **Step 7: Run the UI tests and type checking**

Run the Task 3 Step 3 command, then TypeScript as in Task 1 Step 9.

Expected: UI tests PASS and TypeScript exits with code 0.

- [ ] **Step 8: Commit only Task 3 files**

```powershell
git add app/page.tsx components/AppShell.tsx components/AdminApprovalPanel.tsx tests/app-shell.test.tsx tests/admin-approval-panel.test.tsx
git commit -m "security: restrict administrator controls to owner"
```

---

### Task 4: Environment contract and complete verification

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Test: all files under `tests/`

**Interfaces:**
- Produces: documented server-only environment variable `ADMIN_EMAIL`
- Consumes: all completed behavior from Tasks 1 through 3

- [ ] **Step 1: Add the environment variable name without a real email**

Append to `.env.example`:

```text
ADMIN_EMAIL=
```

Do not add a real email address and do not add a `NEXT_PUBLIC_` variant.

- [ ] **Step 2: Document local and deployment configuration**

Add a README security note explaining:

```text
ADMIN_EMAIL is the only administrator identity. Put the real Google account email in .env.local for local use and in the deployment provider's server environment variables for deployment. Never expose it through NEXT_PUBLIC_ variables. Restart the server after changing it.
```

- [ ] **Step 3: Run the focused security regression suite**

Run:

```powershell
& 'C:\Users\tkddb\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\vitest\vitest.mjs run .\tests\admin-identity.test.ts .\tests\authz.test.ts .\tests\api\admin-users.test.ts .\tests\app-shell.test.tsx .\tests\admin-approval-panel.test.tsx --pool=vmThreads --reporter=dot
```

Expected: all focused files and tests PASS.

- [ ] **Step 4: Run the entire automated test suite**

Run:

```powershell
& 'C:\Users\tkddb\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\vitest\vitest.mjs run --pool=vmThreads --reporter=dot
```

Expected: all tests PASS with no unhandled errors.

- [ ] **Step 5: Run TypeScript and production build verification**

Run:

```powershell
& 'C:\Users\tkddb\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\typescript\bin\tsc --noEmit
& 'C:\Users\tkddb\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\next\dist\bin\next build
```

Expected: TypeScript exits with code 0 and Next.js reports a successful production build. If the build alone fails with a sandbox `EPERM` process-spawn error, rerun the same build with approved elevated execution and do not change application code for that environment-only failure.

- [ ] **Step 6: Perform a final authorization review**

Search the application for `role: "admin"`, `role === "admin"`, and admin update fields. Confirm that only session display and fixed-email checks remain, and that no API accepts role mutation.

- [ ] **Step 7: Commit only documentation and environment example changes**

```powershell
git add .env.example README.md
git commit -m "docs: document fixed administrator configuration"
```

## Manual configuration after implementation

The application owner adds the real Google login email to `.env.local` without sharing it in chat or source control:

```text
ADMIN_EMAIL=owner-google-email@example.com
```

Restart the local development server after saving the file. The placeholder above is illustrative only and must not be copied as the real value.
