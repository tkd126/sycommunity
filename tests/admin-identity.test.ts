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
