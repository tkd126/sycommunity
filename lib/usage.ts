import { prisma } from "@/lib/db";

export type UsagePricing = {
  inputPricePer1MUsd: number;
  outputPricePer1MUsd: number;
  usdKrwRate: number;
};

export type BudgetStatus = "normal" | "warning" | "limit";

export function calculateCostKrw(
  usage: { inputTokens: number; outputTokens: number },
  pricing: UsagePricing,
): number {
  const inputCostUsd = (usage.inputTokens / 1_000_000) * pricing.inputPricePer1MUsd;
  const outputCostUsd = (usage.outputTokens / 1_000_000) * pricing.outputPricePer1MUsd;
  return Math.ceil((inputCostUsd + outputCostUsd) * pricing.usdKrwRate);
}

export function getBudgetStatus(usedKrw: number, budgetKrw: number): BudgetStatus {
  if (usedKrw >= budgetKrw) return "limit";
  if (usedKrw >= budgetKrw * 0.9) return "warning";
  return "normal";
}

export function getKoreaMonthRange(now = new Date()): { start: Date; end: Date } {
  const koreaOffsetMilliseconds = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(now.getTime() + koreaOffsetMilliseconds);
  const year = koreaNow.getUTCFullYear();
  const month = koreaNow.getUTCMonth();

  return {
    start: new Date(Date.UTC(year, month, 1) - koreaOffsetMilliseconds),
    end: new Date(Date.UTC(year, month + 1, 1) - koreaOffsetMilliseconds),
  };
}

export async function getMonthlyUsageKrw(now = new Date()): Promise<number> {
  const { start, end } = getKoreaMonthRange(now);
  const result = await prisma.usageEvent.aggregate({
    _sum: { costKrw: true },
    where: { createdAt: { gte: start, lt: end } },
  });
  return result._sum.costKrw ?? 0;
}

export async function saveUsageEvent(input: {
  inputTokens: number;
  outputTokens: number;
  costKrw: number;
  model: string;
}): Promise<void> {
  await prisma.usageEvent.create({ data: input });
}
