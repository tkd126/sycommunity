import { describe, expect, it, vi } from "vitest";

import { handleProofread } from "@/app/api/proofread/handler";

const validInput = {
  password: "teacher-password",
  rows: [{ id: "row-1", comment: "학교 생활에 참여 함." }],
};

const activeAccess = vi.fn().mockResolvedValue({
  ok: true,
  userId: "user-1",
  email: "teacher@example.com",
  role: "teacher",
} as const);

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    config: {
      teacherAccessPassword: "teacher-password",
      monthlyBudgetKrw: 30_000,
      model: "gpt-5.6-terra",
      usdKrwRate: 1400,
      inputPricePer1MUsd: 0.4,
      outputPricePer1MUsd: 1.6,
    },
    getMonthlyUsageKrw: vi.fn().mockResolvedValue(1_000),
    create: vi.fn().mockResolvedValue({
      output_text: JSON.stringify({ rows: [{ id: "row-1", comment: "학교생활에 참여함." }] }),
      usage: { input_tokens: 100, output_tokens: 50 },
    }),
    saveUsageEvent: vi.fn().mockResolvedValue(undefined),
    allowRequest: () => true,
    requireActiveSubscription: activeAccess,
    ...overrides,
  };
}

describe("handleProofread", () => {
  it("rejects users without an active approved account before OpenAI", async () => {
    const create = vi.fn();
    const response = await handleProofread(new Request("http://localhost/api/proofread", {
      method: "POST",
      body: JSON.stringify(validInput),
    }), dependencies({
      create,
      requireActiveSubscription: vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        code: "SUBSCRIPTION_REQUIRED",
        message: "관리자 승인 후 이용할 수 있습니다.",
      }),
    }));

    expect(response.status).toBe(403);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a wrong password, rate limit, and monthly budget before OpenAI", async () => {
    const wrongPasswordCreate = vi.fn();
    const wrongPassword = await handleProofread(new Request("http://localhost/api/proofread", {
      method: "POST",
      body: JSON.stringify({ ...validInput, password: "wrong" }),
    }), dependencies({ create: wrongPasswordCreate }));
    expect(wrongPassword.status).toBe(401);
    expect(wrongPasswordCreate).not.toHaveBeenCalled();

    const limitedCreate = vi.fn();
    const limited = await handleProofread(new Request("http://localhost/api/proofread", {
      method: "POST",
      body: JSON.stringify(validInput),
    }), dependencies({ create: limitedCreate, allowRequest: () => false }));
    expect(limited.status).toBe(429);
    expect(limitedCreate).not.toHaveBeenCalled();

    const budgetCreate = vi.fn();
    const budget = await handleProofread(new Request("http://localhost/api/proofread", {
      method: "POST",
      body: JSON.stringify(validInput),
    }), dependencies({ budgetCreate, getMonthlyUsageKrw: vi.fn().mockResolvedValue(30_000) }));
    expect(budget.status).toBe(429);
    expect(budgetCreate).not.toHaveBeenCalled();
  });

  it("returns corrected rows and stores only token-cost usage", async () => {
    const deps = dependencies();
    const response = await handleProofread(new Request("http://localhost/api/proofread", {
      method: "POST",
      body: JSON.stringify(validInput),
    }), deps);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      rows: [{ id: "row-1", comment: "학교생활에 참여함." }],
      usage: { budgetKrw: 30_000 },
    });
    expect(deps.saveUsageEvent).toHaveBeenCalledWith({
      inputTokens: 100,
      outputTokens: 50,
      costKrw: expect.any(Number),
      model: "gpt-5.6-terra",
    });
    expect(JSON.stringify(deps.saveUsageEvent.mock.calls)).not.toContain("학교 생활에 참여 함");
  });
});
