import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireActiveSubscription, type AccessCheckResult } from "@/lib/authz";
import {
  generateCreativeComments as generateCreativeCommentsWithOpenAi,
  type CreativeCommentInput,
} from "@/lib/creative-activity-openai";
import { createResponseCreator } from "@/lib/openai";
import { reportRateLimiter } from "@/lib/rate-limit";
import { readServerConfig } from "@/lib/server-config";
import {
  calculateCostKrw,
  getMonthlyUsageKrw,
  saveUsageEvent,
  type UsagePricing,
} from "@/lib/usage";
import { CREATIVE_CATEGORIES, MAX_CREATIVE_GENERATION_ROWS } from "@/types/creative-activity";

const MAX_REQUEST_CHARACTERS = 100_000;
const DEFAULT_MODEL = "gpt-5.6-terra";

type RouteConfig = {
  teacherAccessPassword: string;
  monthlyBudgetKrw: number;
  model?: string;
  usdKrwRate?: number;
  inputPricePer1MUsd?: number;
  outputPricePer1MUsd?: number;
};

type GenerateResult = Awaited<ReturnType<typeof generateCreativeCommentsWithOpenAi>>;

type GenerateCreativeActivitiesDependencies = {
  config: RouteConfig;
  requireActiveSubscription: () => Promise<AccessCheckResult>;
  allowRequest: (ip: string) => boolean;
  getMonthlyUsageKrw: () => Promise<number>;
  generateCreativeComments: (
    rows: CreativeCommentInput[],
    model: string,
  ) => Promise<GenerateResult>;
  calculateCostKrw: typeof calculateCostKrw;
  saveUsageEvent: typeof saveUsageEvent;
};

type GenerateCreativeActivitiesRuntimeDependencies = {
  env: Record<string, string | undefined>;
  requireActiveSubscription: () => Promise<AccessCheckResult>;
  readServerConfig: typeof readServerConfig;
  createResponseCreator: typeof createResponseCreator;
  allowRequest: (ip: string) => boolean;
  getMonthlyUsageKrw: () => Promise<number>;
  generateCreativeCommentsWithOpenAi: typeof generateCreativeCommentsWithOpenAi;
  calculateCostKrw: typeof calculateCostKrw;
  saveUsageEvent: typeof saveUsageEvent;
};

function isActualCreativeDate(value: string): boolean {
  const match = value.match(/^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])$/);
  if (!match) return false;

  const month = Number(match[1]);
  const day = Number(match[2]);
  return day <= new Date(2000, month, 0).getDate();
}

const creativeRowSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .max(100)
      .refine((value) => value === value.trim()),
    date: z.string().refine(isActualCreativeDate),
    category: z.enum(CREATIVE_CATEGORIES),
    activity: z.string().trim().min(1).max(200),
    hours: z.number().int().min(1).max(8),
  })
  .strict();

const generateCreativeActivitiesRequestSchema = z
  .object({
    password: z.string().min(1).max(200),
    rows: z.array(creativeRowSchema).min(1).max(MAX_CREATIVE_GENERATION_ROWS),
  })
  .strict()
  .superRefine(({ rows }, context) => {
    const ids = new Set<string>();
    rows.forEach(({ id }, index) => {
      if (ids.has(id)) {
        context.addIssue({
          code: "custom",
          message: "duplicate id",
          path: ["rows", index, "id"],
        });
      }
      ids.add(id);
    });
  });

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ code, message }, { status });
}

function passwordsMatch(received: string, expected: string): boolean {
  const receivedHash = createHash("sha256").update(received).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}

function getRequestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "127.0.0.1"
  );
}

function usagePricing(config: RouteConfig): UsagePricing {
  return {
    usdKrwRate: config.usdKrwRate ?? 1_400,
    inputPricePer1MUsd: config.inputPricePer1MUsd ?? 0.4,
    outputPricePer1MUsd: config.outputPricePer1MUsd ?? 1.6,
  };
}

export async function handleGenerateCreativeActivities(
  request: Request,
  dependencies: GenerateCreativeActivitiesDependencies,
) {
  let access: AccessCheckResult;
  try {
    access = await dependencies.requireActiveSubscription();
  } catch {
    return jsonError(503, "AUTH_UNAVAILABLE", "사용자 인증 상태를 확인하지 못했습니다.");
  }
  if (!access.ok) {
    return NextResponse.json(
      { code: access.code, message: access.message },
      { status: access.status },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_CHARACTERS) {
    return jsonError(413, "REQUEST_TOO_LARGE", "요청 내용이 너무 큽니다.");
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return jsonError(400, "INVALID_BODY", "요청 내용을 확인해 주세요.");
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return jsonError(400, "INVALID_BODY", "요청 내용을 확인해 주세요.");
  }
  if (text.length > MAX_REQUEST_CHARACTERS) {
    return jsonError(413, "REQUEST_TOO_LARGE", "요청 내용이 너무 큽니다.");
  }

  let rawBody: unknown;
  try {
    rawBody = JSON.parse(text);
  } catch {
    return jsonError(400, "INVALID_BODY", "요청 내용을 확인해 주세요.");
  }

  const suppliedRows = typeof rawBody === "object" && rawBody !== null && "rows" in rawBody
    ? (rawBody as { rows?: unknown }).rows
    : undefined;
  if (Array.isArray(suppliedRows) && suppliedRows.length > MAX_CREATIVE_GENERATION_ROWS) {
    return jsonError(400, "TOO_MANY_ROWS", "평어는 한 번에 최대 50개까지 생성할 수 있습니다.");
  }

  const validated = generateCreativeActivitiesRequestSchema.safeParse(rawBody);
  if (!validated.success) {
    return jsonError(400, "INVALID_BODY", "필수 입력값을 확인해 주세요.");
  }

  if (!passwordsMatch(validated.data.password, dependencies.config.teacherAccessPassword)) {
    return jsonError(401, "INVALID_PASSWORD", "교사 접근 비밀번호가 올바르지 않습니다.");
  }

  if (!dependencies.allowRequest(getRequestIp(request))) {
    return jsonError(429, "RATE_LIMITED", "잠시 후 다시 시도해 주세요.");
  }

  let monthlyCostKrw: number;
  try {
    monthlyCostKrw = await dependencies.getMonthlyUsageKrw();
  } catch {
    return jsonError(503, "USAGE_UNAVAILABLE", "사용량을 확인하지 못했습니다.");
  }

  if (monthlyCostKrw >= dependencies.config.monthlyBudgetKrw) {
    return jsonError(429, "MONTHLY_LIMIT", "이번 달 사용 한도에 도달했습니다.");
  }

  const model = dependencies.config.model ?? DEFAULT_MODEL;
  let generated: GenerateResult;
  try {
    generated = await dependencies.generateCreativeComments(validated.data.rows, model);
  } catch {
    return jsonError(502, "GENERATION_FAILED", "평어 생성 결과를 확인하지 못했습니다.");
  }

  const costKrw = dependencies.calculateCostKrw(
    generated.usage,
    usagePricing(dependencies.config),
  );
  try {
    await dependencies.saveUsageEvent({
      inputTokens: generated.usage.inputTokens,
      outputTokens: generated.usage.outputTokens,
      costKrw,
      model,
    });
  } catch {
    return jsonError(503, "USAGE_SAVE_FAILED", "사용량을 저장하지 못했습니다.");
  }

  return NextResponse.json({
    rows: generated.rows.map(({ id, comment }) => ({ id, comment })),
    usage: {
      amountKrw: monthlyCostKrw + costKrw,
      budgetKrw: dependencies.config.monthlyBudgetKrw,
    },
  });
}

export async function handleGenerateCreativeActivitiesPost(
  request: Request,
  dependencies: GenerateCreativeActivitiesRuntimeDependencies,
) {
  let access: AccessCheckResult;
  try {
    access = await dependencies.requireActiveSubscription();
  } catch {
    return jsonError(503, "AUTH_UNAVAILABLE", "사용자 인증 상태를 확인하지 못했습니다.");
  }
  if (!access.ok) {
    return NextResponse.json(
      { code: access.code, message: access.message },
      { status: access.status },
    );
  }

  try {
    const config = dependencies.readServerConfig(dependencies.env);
    let creator: ReturnType<typeof createResponseCreator> | undefined;
    return await handleGenerateCreativeActivities(request, {
      config,
      requireActiveSubscription: async () => access,
      allowRequest: dependencies.allowRequest,
      getMonthlyUsageKrw: dependencies.getMonthlyUsageKrw,
      generateCreativeComments: (rows, model) => {
        creator ??= dependencies.createResponseCreator(config.apiKey);
        return dependencies.generateCreativeCommentsWithOpenAi(rows, creator, model);
      },
      calculateCostKrw: dependencies.calculateCostKrw,
      saveUsageEvent: dependencies.saveUsageEvent,
    });
  } catch {
    return jsonError(500, "SERVER_CONFIG_ERROR", "서버 설정을 확인해 주세요.");
  }
}

export async function POST(request: Request) {
  return await handleGenerateCreativeActivitiesPost(request, {
    env: process.env,
    requireActiveSubscription,
    readServerConfig,
    createResponseCreator,
    allowRequest: (ip) => reportRateLimiter.check(ip),
    getMonthlyUsageKrw,
    generateCreativeCommentsWithOpenAi,
    calculateCostKrw,
    saveUsageEvent,
  });
}
