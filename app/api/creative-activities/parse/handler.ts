import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { requireActiveSubscription, type AccessCheckResult } from "@/lib/authz";
import {
  normalizeCreativeDate,
  parseCreativeTimetableLocally,
  selectCreativeSemesterText,
} from "@/lib/creative-activity";
import { parseCreativeActivities as parseCreativeActivitiesWithOpenAi } from "@/lib/creative-activity-openai";
import { extractDocumentText as extractDocumentTextFromBytes } from "@/lib/document-extraction";
import { createResponseCreator } from "@/lib/openai";
import { reportRateLimiter } from "@/lib/rate-limit";
import { readServerConfig } from "@/lib/server-config";
import {
  calculateCostKrw,
  getMonthlyUsageKrw,
  saveUsageEvent,
  type UsagePricing,
} from "@/lib/usage";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_BYTES = 11 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_LENGTH = 60_000;
const DEFAULT_MODEL = "gpt-5.6-terra";

type RouteConfig = {
  teacherAccessPassword: string;
  monthlyBudgetKrw: number;
  model?: string;
  usdKrwRate?: number;
  inputPricePer1MUsd?: number;
  outputPricePer1MUsd?: number;
};

type ParseResult = Awaited<ReturnType<typeof parseCreativeActivitiesWithOpenAi>>;

type ParseCreativeActivitiesDependencies = {
  config: RouteConfig;
  requireActiveSubscription: () => Promise<AccessCheckResult>;
  allowRequest: (ip: string) => boolean;
  getMonthlyUsageKrw: () => Promise<number>;
  extractDocumentText: (file: File) => Promise<string>;
  parseCreativeActivities: (text: string, model: string) => Promise<ParseResult>;
  calculateCostKrw: typeof calculateCostKrw;
  saveUsageEvent: typeof saveUsageEvent;
};

type ParseCreativeActivitiesRuntimeDependencies = {
  env: Record<string, string | undefined>;
  requireActiveSubscription: () => Promise<AccessCheckResult>;
  readServerConfig: typeof readServerConfig;
  createResponseCreator: typeof createResponseCreator;
  allowRequest: (ip: string) => boolean;
  getMonthlyUsageKrw: () => Promise<number>;
  extractDocumentTextFromBytes: typeof extractDocumentTextFromBytes;
  parseCreativeActivitiesWithOpenAi: typeof parseCreativeActivitiesWithOpenAi;
  calculateCostKrw: typeof calculateCostKrw;
  saveUsageEvent: typeof saveUsageEvent;
};

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

function isUploadedFile(value: FormDataEntryValue): value is File {
  return (
    typeof value !== "string"
    && typeof value.name === "string"
    && typeof value.size === "number"
    && typeof value.arrayBuffer === "function"
  );
}

function hasSupportedExtension(fileName: string): boolean {
  return [".hwp", ".hwpx", ".pdf"].some((extension) =>
    fileName.toLowerCase().endsWith(extension),
  );
}

function containsObviousIdentity(line: string): boolean {
  const identityLabel = /학교명|담임|교사명/;
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(?:\+82[-.\s]?|0)\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/;
  const gradeAndClass = /\d+\s*학년\s*\d+\s*반/;
  return identityLabel.test(line) || email.test(line) || phone.test(line) || gradeAndClass.test(line);
}

function extractSensitiveValues(line: string): string[] {
  const values = [
    ...line.matchAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi),
    ...line.matchAll(/(?:\+82[-.\s]?|0)\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/g),
    ...line.matchAll(/\d+\s*학년\s*\d+\s*반/g),
    ...line.matchAll(/[가-힣A-Za-z0-9]+(?:초등학교|중학교|고등학교)/g),
  ].map(([value]) => value.trim());
  const labelledValue = line.match(/(?:학교명|담임|교사명)\s*[:：]?\s*(.+)$/)?.[1]?.trim();
  if (labelledValue) {
    values.push(labelledValue, labelledValue.split(/[\s,;/]+/)[0] ?? "");
  }
  return values.filter((value) => value.length >= 2);
}

function redactIdentityHeaders(text: string): { text: string; sensitiveValues: string[] } {
  const keptLines: string[] = [];
  const sensitiveValues = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    if (!containsObviousIdentity(line)) {
      keptLines.push(line);
      continue;
    }
    extractSensitiveValues(line).forEach((value) => sensitiveValues.add(value));
  }
  return { text: keptLines.join("\n").trim(), sensitiveValues: [...sensitiveValues] };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function redactResponseText(value: string, sensitiveValues: string[]): string {
  let redacted = sensitiveValues
    .sort((left, right) => right.length - left.length)
    .reduce(
      (current, sensitive) => current.replace(new RegExp(escapeRegExp(sensitive), "gu"), ""),
      value,
    );
  redacted = redacted
    .replace(/(?:학교명|담임|교사명)\s*[:：]?/g, "")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "")
    .replace(/(?:\+82[-.\s]?|0)\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/g, "")
    .replace(/\d+\s*학년\s*\d+\s*반/g, "")
    .replace(/[가-힣A-Za-z0-9]+(?:초등학교|중학교|고등학교)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return redacted;
}

function usagePricing(config: RouteConfig): UsagePricing {
  return {
    usdKrwRate: config.usdKrwRate ?? 1_400,
    inputPricePer1MUsd: config.inputPricePer1MUsd ?? 0.4,
    outputPricePer1MUsd: config.outputPricePer1MUsd ?? 1.6,
  };
}

export async function handleParseCreativeActivities(
  request: Request,
  dependencies: ParseCreativeActivitiesDependencies,
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
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return jsonError(413, "REQUEST_TOO_LARGE", "요청 크기는 11MB를 넘을 수 없습니다.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "INVALID_FORM_DATA", "파일 요청 형식을 확인해 주세요.");
  }

  const passwordEntries = form.getAll("password");
  const fileEntries = form.getAll("file");
  const semesterEntries = form.getAll("semester");
  const allEntries = [...form.entries()];
  const allFiles = allEntries.filter(([, value]) => isUploadedFile(value));
  const hasUnexpectedField = allEntries.some(
    ([key]) => key !== "password" && key !== "file" && key !== "semester",
  );
  const password = passwordEntries[0];
  const file = fileEntries[0];
  const semesterValue = semesterEntries[0] ?? "1";
  if (
    passwordEntries.length !== 1
    || typeof password !== "string"
    || password.length < 1
    || password.length > 200
    || semesterEntries.length > 1
    || (semesterValue !== "1" && semesterValue !== "2")
    || fileEntries.length !== 1
    || !file
    || !isUploadedFile(file)
    || allFiles.length !== 1
    || hasUnexpectedField
  ) {
    return jsonError(400, "INVALID_FORM_DATA", "비밀번호와 문서 파일을 확인해 주세요.");
  }

  if (!passwordsMatch(password, dependencies.config.teacherAccessPassword)) {
    return jsonError(401, "INVALID_PASSWORD", "교사 접근 비밀번호가 올바르지 않습니다.");
  }

  const ip = getRequestIp(request);
  if (!dependencies.allowRequest(ip)) {
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

  if (!hasSupportedExtension(file.name)) {
    return jsonError(400, "UNSUPPORTED_FILE_TYPE", "HWP, HWPX, PDF 파일만 사용할 수 있습니다.");
  }
  if (file.size === 0) {
    return jsonError(400, "EMPTY_FILE", "비어 있지 않은 파일을 선택해 주세요.");
  }
  if (file.size > MAX_FILE_BYTES) {
    return jsonError(413, "FILE_TOO_LARGE", "파일 크기는 10MB를 넘을 수 없습니다.");
  }

  let extractedText: string;
  try {
    extractedText = await dependencies.extractDocumentText(file);
  } catch {
    return jsonError(422, "DOCUMENT_EXTRACTION_FAILED", "문서 내용을 읽지 못했습니다.");
  }
  if (!extractedText.trim()) {
    return jsonError(422, "EMPTY_DOCUMENT", "문서에서 분석할 텍스트를 찾지 못했습니다.");
  }

  const semesterText = selectCreativeSemesterText(extractedText, semesterValue);
  const redaction = redactIdentityHeaders(semesterText);
  const redactedText = redaction.text.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
  if (!redactedText.trim()) {
    return jsonError(422, "EMPTY_DOCUMENT", "문서에서 분석할 텍스트를 찾지 못했습니다.");
  }

  const localActivities = parseCreativeTimetableLocally(redactedText);
  if (localActivities) {
    const activities = localActivities.map((activity) => {
      const redactedActivity = redactResponseText(activity.activity, redaction.sensitiveValues);
      const normalizedDate = normalizeCreativeDate(activity.date);
      return {
        id: activity.id,
        selected: activity.selected,
        date: normalizedDate ?? "확인 필요",
        category: activity.category,
        activity: redactedActivity || "활동 내용 확인 필요",
        hours: activity.hours,
        needsReview: activity.needsReview || !redactedActivity || !normalizedDate,
        comment: "",
      };
    });
    return NextResponse.json({
      activities,
      warnings: [
        "표준 시간표 형식을 로컬에서 분석했습니다. 활동과 구분을 확인해 주세요.",
      ],
      usage: {
        amountKrw: monthlyCostKrw,
        budgetKrw: dependencies.config.monthlyBudgetKrw,
      },
    });
  }

  const model = dependencies.config.model ?? DEFAULT_MODEL;
  let parsed: ParseResult;
  try {
    parsed = await dependencies.parseCreativeActivities(redactedText, model);
  } catch {
    return jsonError(502, "PARSING_FAILED", "시간표 분석 결과를 확인하지 못했습니다.");
  }

  if (parsed.activities.length === 0) {
    return jsonError(
      422,
      "NO_CREATIVE_ACTIVITIES",
      "창체, 자율, 봉사, 진로 또는 자, 봉, 진 표기를 찾지 못했습니다.",
    );
  }

  const costKrw = dependencies.calculateCostKrw(parsed.usage, usagePricing(dependencies.config));
  try {
    await dependencies.saveUsageEvent({
      inputTokens: parsed.usage.inputTokens,
      outputTokens: parsed.usage.outputTokens,
      costKrw,
      model,
    });
  } catch {
    return jsonError(503, "USAGE_SAVE_FAILED", "사용량을 저장하지 못했습니다.");
  }

  const activities = parsed.activities.map((activity) => {
    const redactedActivity = redactResponseText(activity.activity, redaction.sensitiveValues);
    const normalizedDate = normalizeCreativeDate(activity.date);
    return {
      id: activity.id,
      selected: activity.selected,
      date: normalizedDate ?? "확인 필요",
      category: activity.category,
      activity: redactedActivity || "활동 내용 확인 필요",
      hours: activity.hours,
      needsReview: activity.needsReview || !redactedActivity || !normalizedDate,
      comment: redactResponseText(activity.comment, redaction.sensitiveValues),
    };
  });
  const warnings = parsed.warnings
    .map((warning) => redactResponseText(warning, redaction.sensitiveValues))
    .filter(Boolean);

  return NextResponse.json({
    activities,
    warnings,
    usage: {
      amountKrw: monthlyCostKrw + costKrw,
      budgetKrw: dependencies.config.monthlyBudgetKrw,
    },
  });
}

export async function handleParseCreativeActivitiesPost(
  request: Request,
  dependencies: ParseCreativeActivitiesRuntimeDependencies,
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
    return await handleParseCreativeActivities(request, {
      config,
      requireActiveSubscription: async () => access,
      allowRequest: dependencies.allowRequest,
      getMonthlyUsageKrw: dependencies.getMonthlyUsageKrw,
      extractDocumentText: async (file) =>
        dependencies.extractDocumentTextFromBytes(
          new Uint8Array(await file.arrayBuffer()),
          file.name,
        ),
      parseCreativeActivities: (text, model) => {
        creator ??= dependencies.createResponseCreator(config.apiKey);
        return dependencies.parseCreativeActivitiesWithOpenAi(text, creator, model);
      },
      calculateCostKrw: dependencies.calculateCostKrw,
      saveUsageEvent: dependencies.saveUsageEvent,
    });
  } catch {
    return jsonError(500, "SERVER_CONFIG_ERROR", "서버 설정을 확인해 주세요.");
  }
}

export async function POST(request: Request) {
  return await handleParseCreativeActivitiesPost(request, {
    env: process.env,
    requireActiveSubscription,
    readServerConfig,
    createResponseCreator,
    allowRequest: (ip) => reportRateLimiter.check(ip),
    getMonthlyUsageKrw,
    extractDocumentTextFromBytes,
    parseCreativeActivitiesWithOpenAi,
    calculateCostKrw,
    saveUsageEvent,
  });
}
