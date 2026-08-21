import { describe, expect, it } from "vitest";

import { readServerConfig } from "@/lib/server-config";

describe("readServerConfig", () => {
  it("API 키가 없으면 환경변수 이름만 포함한 오류를 낸다", () => {
    expect(() =>
      readServerConfig({
        TEACHER_ACCESS_PASSWORD: "pw",
        DATABASE_URL: "postgresql://localhost/test",
      }),
    ).toThrow("OPENAI_API_KEY 환경변수가 필요합니다");
  });

  it("가격과 예산 기본값을 적용한다", () => {
    const config = readServerConfig({
      OPENAI_API_KEY: "test-key",
      TEACHER_ACCESS_PASSWORD: "pw",
      DATABASE_URL: "postgresql://localhost/test",
    });

    expect(config).toMatchObject({
      model: "gpt-5.6-terra",
      monthlyBudgetKrw: 30_000,
      usdKrwRate: 1400,
      inputPricePer1MUsd: 2,
      outputPricePer1MUsd: 12,
    });
  });
});
