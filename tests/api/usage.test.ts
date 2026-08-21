import { describe, expect, it, vi } from "vitest";

import { handleGetUsage } from "@/app/api/usage/handler";

const activeAccess = vi.fn().mockResolvedValue({
  ok: true,
  userId: "user-1",
  email: "teacher@example.com",
  role: "teacher",
} as const);

describe("GET /api/usage", () => {
  it("승인된 사용자가 아니면 사용량을 반환하지 않는다", async () => {
    const response = await handleGetUsage({
      getMonthlyUsageKrw: vi.fn(),
      budgetKrw: 30_000,
      requireActiveSubscription: vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        code: "SUBSCRIPTION_REQUIRED",
        message: "관리자 승인 후 이용할 수 있습니다.",
      }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "SUBSCRIPTION_REQUIRED" });
  });

  it("이번 달 사용량과 예산 상태를 반환한다", async () => {
    const response = await handleGetUsage({
      getMonthlyUsageKrw: vi.fn().mockResolvedValue(18_420),
      budgetKrw: 30_000,
      requireActiveSubscription: activeAccess,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      amountKrw: 18_420,
      budgetKrw: 30_000,
      status: "normal",
    });
  });

  it("데이터베이스 오류를 503으로 반환한다", async () => {
    const response = await handleGetUsage({
      getMonthlyUsageKrw: vi.fn().mockRejectedValue(new Error("db unavailable")),
      budgetKrw: 30_000,
      requireActiveSubscription: activeAccess,
    });

    expect(response.status).toBe(503);
  });
});
