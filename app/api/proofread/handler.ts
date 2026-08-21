import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { createResponseCreator, type ResponseCreator } from "@/lib/openai";
import { proofreadComments, proofreadRequestSchema } from "@/lib/proofread";
import { reportRateLimiter } from "@/lib/rate-limit";
import { readServerConfig } from "@/lib/server-config";
import { calculateCostKrw, getMonthlyUsageKrw, saveUsageEvent } from "@/lib/usage";
import { requireActiveSubscription, type AccessCheckResult } from "@/lib/authz";

type ProofreadRouteConfig = {
  teacherAccessPassword: string;
  monthlyBudgetKrw: number;
  model?: string;
  usdKrwRate?: number;
  inputPricePer1MUsd?: number;
  outputPricePer1MUsd?: number;
};

type ProofreadDependencies = {
  config: ProofreadRouteConfig;
  getMonthlyUsageKrw: () => Promise<number>;
  create: ResponseCreator["create"];
  saveUsageEvent: typeof saveUsageEvent;
  allowRequest: (ip: string) => boolean;
  requireActiveSubscription: () => Promise<AccessCheckResult>;
};

function passwordsMatch(received: string, expected: string): boolean {
  const receivedHash = createHash("sha256").update(received).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}

function requestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "127.0.0.1";
}

export async function handleProofread(request: Request, dependencies: ProofreadDependencies) {
  const access = await dependencies.requireActiveSubscription();
  if (!access.ok) {
    return NextResponse.json({ code: access.code, message: access.message }, { status: access.status });
  }

  let rawBody: unknown;
  try {
    const text = await request.text();
    if (text.length > 40_000) throw new Error("too large");
    rawBody = JSON.parse(text);
  } catch {
    return NextResponse.json({ code: "INVALID_BODY", message: "검사할 문장을 확인해 주세요." }, { status: 400 });
  }

  const validated = proofreadRequestSchema.safeParse(rawBody);
  if (!validated.success) {
    return NextResponse.json({ code: "INVALID_BODY", message: "검사할 문장을 확인해 주세요." }, { status: 400 });
  }
  if (!passwordsMatch(validated.data.password, dependencies.config.teacherAccessPassword)) {
    return NextResponse.json({ code: "INVALID_PASSWORD", message: "교사 접근 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }
  if (!dependencies.allowRequest(requestIp(request))) {
    return NextResponse.json({ code: "RATE_LIMITED", message: "잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  let monthlyCostKrw: number;
  try {
    monthlyCostKrw = await dependencies.getMonthlyUsageKrw();
  } catch {
    return NextResponse.json({ code: "USAGE_UNAVAILABLE", message: "사용량을 확인하지 못했습니다." }, { status: 503 });
  }
  if (monthlyCostKrw >= dependencies.config.monthlyBudgetKrw) {
    return NextResponse.json({ code: "MONTHLY_LIMIT", message: "이번 달 사용 한도에 도달했습니다." }, { status: 429 });
  }

  try {
    const model = dependencies.config.model ?? "gpt-5.6-terra";
    const corrected = await proofreadComments(validated.data, { create: dependencies.create }, model);
    const costKrw = calculateCostKrw(corrected.usage, {
      usdKrwRate: dependencies.config.usdKrwRate ?? 1400,
      inputPricePer1MUsd: dependencies.config.inputPricePer1MUsd ?? 0.4,
      outputPricePer1MUsd: dependencies.config.outputPricePer1MUsd ?? 1.6,
    });
    await dependencies.saveUsageEvent({ ...corrected.usage, costKrw, model });
    return NextResponse.json({
      rows: corrected.rows,
      usage: { amountKrw: monthlyCostKrw + costKrw, budgetKrw: dependencies.config.monthlyBudgetKrw },
    });
  } catch {
    return NextResponse.json({ code: "PROOFREAD_FAILED", message: "맞춤법 검사 결과를 확인하지 못했습니다." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const config = readServerConfig(process.env);
    const creator = createResponseCreator(config.apiKey);
    return handleProofread(request, {
      config,
      getMonthlyUsageKrw,
      create: creator.create,
      saveUsageEvent,
      allowRequest: (ip) => reportRateLimiter.check(ip),
      requireActiveSubscription,
    });
  } catch {
    return NextResponse.json({ code: "SERVER_CONFIG_ERROR", message: "서버 설정을 확인해 주세요." }, { status: 500 });
  }
}
