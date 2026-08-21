import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  createResponseCreator,
  generateReportRequestSchema,
  generateReports,
  type ResponseCreator,
} from "@/lib/openai";
import { reportRateLimiter } from "@/lib/rate-limit";
import { splitReportStudents } from "@/lib/report-batches";
import { readServerConfig } from "@/lib/server-config";
import { calculateCostKrw, getMonthlyUsageKrw, saveUsageEvent } from "@/lib/usage";
import { requireActiveSubscription, type AccessCheckResult } from "@/lib/authz";

type RouteConfig = {
  teacherAccessPassword: string;
  monthlyBudgetKrw: number;
  model?: string;
  usdKrwRate?: number;
  inputPricePer1MUsd?: number;
  outputPricePer1MUsd?: number;
};

type GenerateRouteDependencies = {
  config: RouteConfig;
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

function getRequestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

function safeGenerationError(error: unknown): { code: string; message: string } {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("영역별 평어") || message.includes("선택 영역")) {
    return { code: "AREA_FORMAT", message: "일부 영역의 평어 형식을 확인하지 못했습니다. 다시 생성해 주세요." };
  }
  if (message.includes("JSON") || message.includes("학생 번호")) {
    return { code: "OUTPUT_FORMAT", message: "생성 결과 형식을 확인하지 못했습니다. 다시 생성해 주세요." };
  }
  return { code: "GENERATION_FAILED", message: "평어 생성 결과를 확인하지 못했습니다." };
}

export async function handleGenerateReport(
  request: Request,
  dependencies: GenerateRouteDependencies,
) {
  const access = await dependencies.requireActiveSubscription();
  if (!access.ok) {
    return NextResponse.json(
      { code: access.code, message: access.message },
      { status: access.status },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 100_000) {
    return NextResponse.json({ code: "INPUT_TOO_LARGE", message: "입력 내용이 너무 깁니다." }, { status: 413 });
  }

  let rawBody: unknown;
  try {
    const text = await request.text();
    if (text.length > 100_000) throw new Error("too large");
    rawBody = JSON.parse(text);
  } catch {
    return NextResponse.json({ code: "INVALID_BODY", message: "요청 내용을 확인해 주세요." }, { status: 400 });
  }

  const validated = generateReportRequestSchema.safeParse(rawBody);
  if (!validated.success) {
    return NextResponse.json({ code: "INVALID_BODY", message: "필수 입력값을 확인해 주세요." }, { status: 400 });
  }

  if (!passwordsMatch(validated.data.password, dependencies.config.teacherAccessPassword)) {
    return NextResponse.json({ code: "INVALID_PASSWORD", message: "교사 접근 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const ip = getRequestIp(request);
  if (!dependencies.allowRequest(ip)) {
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

  const wantsProgressStream = request.headers.get("accept")?.includes("application/x-ndjson") ?? false;

  if (wantsProgressStream) {
    const encoder = new TextEncoder();
    const batches = splitReportStudents(validated.data.students);
    const total = validated.data.students.length;
    const model = dependencies.config.model ?? "gpt-5.6-terra";
    const pricing = {
      usdKrwRate: dependencies.config.usdKrwRate ?? 1400,
      inputPricePer1MUsd: dependencies.config.inputPricePer1MUsd ?? 0.4,
      outputPricePer1MUsd: dependencies.config.outputPricePer1MUsd ?? 1.6,
    };

    const stream = new ReadableStream({
      start(controller) {
        const send = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        void (async () => {
          let completed = 0;
          let failed = 0;
          let addedCostKrw = 0;

          await Promise.all(batches.map(async (students) => {
            try {
              const generated = await generateReports(
                { ...validated.data, students },
                { create: dependencies.create },
                model,
              );
              const costKrw = calculateCostKrw(generated.usage, pricing);
              await dependencies.saveUsageEvent({ ...generated.usage, costKrw, model });
              addedCostKrw += costKrw;
              completed += generated.rows.length;
              send({
                type: "progress",
                completed,
                total,
                rows: generated.rows,
              });
            } catch (error) {
              failed += students.length;
              send({ type: "error", failed: students.length, total, ...safeGenerationError(error) });
            }
          }));

          send({
            type: "complete",
            completed,
            failed,
            total,
            usage: {
              amountKrw: monthlyCostKrw + addedCostKrw,
              budgetKrw: dependencies.config.monthlyBudgetKrw,
            },
          });
          controller.close();
        })().catch(() => {
          send({ type: "error", code: "STREAM_FAILED", message: "생성 진행 연결이 중단되었습니다.", total });
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  try {
    const model = dependencies.config.model ?? "gpt-5.6-terra";
    const generated = await generateReports(
      validated.data,
      { create: dependencies.create },
      model,
    );
    const costKrw = calculateCostKrw(generated.usage, {
      usdKrwRate: dependencies.config.usdKrwRate ?? 1400,
      inputPricePer1MUsd: dependencies.config.inputPricePer1MUsd ?? 0.4,
      outputPricePer1MUsd: dependencies.config.outputPricePer1MUsd ?? 1.6,
    });

    try {
      await dependencies.saveUsageEvent({ ...generated.usage, costKrw, model });
    } catch {
      return NextResponse.json({ code: "USAGE_SAVE_FAILED", message: "사용량을 저장하지 못했습니다." }, { status: 503 });
    }

    return NextResponse.json({
      subject: generated.subject,
      warning: generated.warning,
      rows: generated.rows,
      usage: {
        amountKrw: monthlyCostKrw + costKrw,
        budgetKrw: dependencies.config.monthlyBudgetKrw,
      },
    });
  } catch (error) {
    const safeError = safeGenerationError(error);
    return NextResponse.json(safeError, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const config = readServerConfig(process.env);
    const creator = createResponseCreator(config.apiKey);
    return handleGenerateReport(request, {
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
