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
