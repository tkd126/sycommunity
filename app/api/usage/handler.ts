import { NextResponse } from "next/server";

import { requireActiveSubscription, type AccessCheckResult } from "@/lib/authz";
import { getBudgetStatus, getMonthlyUsageKrw } from "@/lib/usage";

type UsageDependencies = {
  getMonthlyUsageKrw: () => Promise<number>;
  budgetKrw: number;
  requireActiveSubscription: () => Promise<AccessCheckResult>;
};

export async function handleGetUsage(dependencies: UsageDependencies) {
  const access = await dependencies.requireActiveSubscription();
  if (!access.ok) {
    return NextResponse.json(
      { code: access.code, message: access.message },
      { status: access.status },
    );
  }

  try {
    const amountKrw = await dependencies.getMonthlyUsageKrw();
    return NextResponse.json({
      amountKrw,
      budgetKrw: dependencies.budgetKrw,
      status: getBudgetStatus(amountKrw, dependencies.budgetKrw),
    });
  } catch {
    return NextResponse.json(
      { code: "USAGE_UNAVAILABLE", message: "사용량을 확인하지 못했습니다." },
      { status: 503 },
    );
  }
}

export async function GET() {
  const budgetKrw = Number(process.env.MONTHLY_BUDGET_KRW ?? 30_000);
  if (!Number.isFinite(budgetKrw) || budgetKrw <= 0) {
    return NextResponse.json(
      { code: "SERVER_CONFIG_ERROR", message: "사용량 설정을 확인해 주세요." },
      { status: 500 },
    );
  }
  return handleGetUsage({ getMonthlyUsageKrw, budgetKrw, requireActiveSubscription });
}
