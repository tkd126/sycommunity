import { describe, expect, it } from "vitest";

import { calculateCostKrw, getBudgetStatus, getKoreaMonthRange } from "@/lib/usage";

describe("usage", () => {
  it("토큰 비용을 원 단위로 올림 계산한다", () => {
    expect(
      calculateCostKrw(
        { inputTokens: 1_000_000, outputTokens: 1_000_000 },
        { inputPricePer1MUsd: 0.4, outputPricePer1MUsd: 1.6, usdKrwRate: 1400 },
      ),
    ).toBe(2800);
    expect(
      calculateCostKrw(
        { inputTokens: 1, outputTokens: 0 },
        { inputPricePer1MUsd: 0.4, outputPricePer1MUsd: 1.6, usdKrwRate: 1400 },
      ),
    ).toBe(1);
  });

  it("예산의 90퍼센트부터 경고하고 한도 이상은 차단한다", () => {
    expect(getBudgetStatus(26_999, 30_000)).toBe("normal");
    expect(getBudgetStatus(27_000, 30_000)).toBe("warning");
    expect(getBudgetStatus(30_000, 30_000)).toBe("limit");
  });

  it("한국 시간 기준 월 범위를 UTC 시각으로 계산한다", () => {
    const range = getKoreaMonthRange(new Date("2026-06-30T15:30:00.000Z"));
    expect(range.start.toISOString()).toBe("2026-06-30T15:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-31T15:00:00.000Z");
  });
});
