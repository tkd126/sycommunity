import { NextResponse } from "next/server";
import { z } from "zod";

import { extractStudentNames, parseAchievementDocument } from "@/lib/achievement-parser";
import { requireActiveSubscription, type AccessCheckResult } from "@/lib/authz";
import { extractAchievementPdf, extractDocumentText } from "@/lib/document-extraction";
import type { ParsedArea, ParsedRosterStudent } from "@/types/documents";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_AREA_FILES = 10;
const MAX_REFERENCE_FILES = 10;
const MAX_REFERENCE_TEXT_LENGTH = 30_000;

const areaInputSchema = z
  .array(
    z.object({
      areaId: z.string().min(1).max(100),
      fileKey: z.string().min(1).max(100),
    }),
  )
  .max(MAX_AREA_FILES);

function errorResponse(code: string, message: string) {
  return NextResponse.json({ code, message }, { status: 400 });
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value !== "string" &&
    value !== null &&
    typeof value.name === "string" &&
    typeof value.size === "number" &&
    typeof value.arrayBuffer === "function"
  );
}

async function readFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("파일 한 개의 크기는 10MB를 넘을 수 없습니다.");
  }
  return extractDocumentText(new Uint8Array(await file.arrayBuffer()), file.name);
}

async function readAreaFile(file: File) {
  if (file.size > MAX_FILE_BYTES) throw new Error("파일 한 개의 크기는 10MB를 넘을 수 없습니다.");
  return extractAchievementPdf(new Uint8Array(await file.arrayBuffer()));
}

function safeMessage(error: unknown): string {
  return error instanceof Error ? error.message : "문서를 분석하지 못했습니다.";
}

function chooseAreaName(extractedAreaName: string, parsedAreaName: string) {
  if (!extractedAreaName) return parsedAreaName;
  if (!parsedAreaName) return extractedAreaName;
  if (parsedAreaName.includes(extractedAreaName) && parsedAreaName.length > extractedAreaName.length) return parsedAreaName;
  return extractedAreaName;
}

type ParseDocumentsDependencies = {
  requireActiveSubscription: () => Promise<AccessCheckResult>;
  reportProgress?: (event: ParseProgressEvent) => void;
};

type ParseProgressEvent = {
  percent: number;
  completedFiles: number;
  totalFiles: number;
  stage: string;
};

export async function handleParseDocuments(
  request: Request,
  dependencies: ParseDocumentsDependencies,
) {
  const access = await dependencies.requireActiveSubscription();
  if (!access.ok) {
    return NextResponse.json(
      { code: access.code, message: access.message },
      { status: access.status },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("INVALID_FORM_DATA", "파일 요청 형식을 확인해 주세요.");
  }

  let rawAreas: unknown;
  try {
    rawAreas = JSON.parse(String(form.get("areas") ?? "[]"));
  } catch {
    return errorResponse("INVALID_AREAS", "영역 정보가 올바른 JSON 형식이 아닙니다.");
  }

  const parsedAreas = areaInputSchema.safeParse(rawAreas);
  if (!parsedAreas.success) {
    const tooMany = Array.isArray(rawAreas) && rawAreas.length > MAX_AREA_FILES;
    return errorResponse(
      tooMany ? "TOO_MANY_AREA_FILES" : "INVALID_AREAS",
      tooMany ? "영역별 평가 결과는 최대 10개까지 첨부할 수 있습니다." : "영역 정보를 확인해 주세요.",
    );
  }

  const evaluationPlan = form.get("evaluationPlan");
  const worksheets = form.getAll("worksheets").filter(isUploadedFile);
  if (worksheets.length > MAX_REFERENCE_FILES) {
    return errorResponse("TOO_MANY_REFERENCE_FILES", "수행평가지는 최대 10개까지 첨부할 수 있습니다.");
  }

  const allFiles = [
    ...parsedAreas.data.map((area) => form.get(area.fileKey)).filter(isUploadedFile),
    ...(isUploadedFile(evaluationPlan) ? [evaluationPlan] : []),
    ...worksheets,
  ];
  if (allFiles.some((file) => file.size > MAX_FILE_BYTES)) {
    return errorResponse("FILE_TOO_LARGE", "파일 한 개의 크기는 10MB를 넘을 수 없습니다.");
  }

  const totalFiles = allFiles.length;
  let completedFiles = 0;
  const reportProgress = (percent: number, stage: string) => dependencies.reportProgress?.({
    percent,
    completedFiles,
    totalFiles,
    stage,
  });
  const markFileComplete = (stage: string) => {
    completedFiles += 1;
    const filePercent = totalFiles === 0 ? 85 : 5 + Math.round((completedFiles / totalFiles) * 80);
    reportProgress(Math.min(85, filePercent), stage);
  };
  reportProgress(5, "첨부 파일 확인 완료");

  // Start independent reference-file reads at the same time as achievement PDFs.
  // Name redaction still happens later, after the roster has been parsed.
  const evaluationPlanResultPromise = isUploadedFile(evaluationPlan)
    ? readFile(evaluationPlan)
      .then((text) => ({ text, error: null as unknown }))
      .catch((error: unknown) => ({ text: "", error }))
      .finally(() => markFileComplete("평가 계획 분석 완료"))
    : Promise.resolve({ text: "", error: null as unknown });
  const worksheetResultPromises = worksheets.map((file) =>
    readFile(file)
      .then((text) => ({ text, error: null as unknown }))
      .catch((error: unknown) => ({ text: "", error }))
      .finally(() => markFileComplete("수행평가지 분석 완료")),
  );

  const analyzedAreas = await Promise.all(
    parsedAreas.data.map(async (area) => {
      const file = form.get(area.fileKey);
      if (!isUploadedFile(file)) {
        return { area: { ...area, areaName: "", students: [], warnings: ["영역별 평가 결과 파일이 필요합니다."] }, roster: [], privateNames: [] };
      }

      try {
        const extracted = await readAreaFile(file);
        const text = extracted.text;
        const parsed = parseAchievementDocument(text);
        const areaName = chooseAreaName(extracted.areaName, parsed.areaName);
        const areaWarnings = [
          ...(areaName ? [] : ["문서에서 영역명을 확인하지 못했습니다."]),
          ...(areaName && parsed.students.length > 0 && parsed.students.every((student) => !student.confirmed)
            ? [`${areaName} 영역의 성취 단계를 읽지 못했습니다. 표에서 직접 확인해 주세요.`]
            : []),
        ];
        return { area: {
          areaId: area.areaId,
          areaName,
          students: parsed.students,
          warnings: areaWarnings,
        }, roster: parsed.roster, privateNames: extractStudentNames(text, areaName) };
      } catch (error) {
        return { area: {
          areaId: area.areaId,
          areaName: "",
          students: [],
          warnings: [safeMessage(error)],
        }, roster: [], privateNames: [] };
      } finally {
        markFileComplete("영역별 평가 결과 분석 완료");
      }
    }),
  );

  const areas: ParsedArea[] = analyzedAreas.map((result) => result.area);
  const rosterByNumber = new Map<number, ParsedRosterStudent>();
  for (const result of analyzedAreas) {
    for (const student of result.roster) {
      if (!rosterByNumber.has(student.studentNumber)) rosterByNumber.set(student.studentNumber, student);
    }
  }
  const roster = [...rosterByNumber.values()].sort((a, b) => a.studentNumber - b.studentNumber);
  const privateNames = [...new Set(analyzedAreas.flatMap((result) => result.privateNames ?? []))];
  const redactNames = (value: string) => privateNames.reduce(
    (text, name) => text.replaceAll(name, ""),
    value,
  ).replace(/[ \t]+/g, " ").trim();

  const warnings: string[] = [];
  let evaluationPlanText = "";
  if (isUploadedFile(evaluationPlan)) {
    try {
      const result = await evaluationPlanResultPromise;
      if (result.error) throw result.error;
      evaluationPlanText = redactNames(result.text.slice(0, MAX_REFERENCE_TEXT_LENGTH));
    } catch (error) {
      warnings.push(`평가 계획: ${safeMessage(error)}`);
    }
  }

  const worksheetTexts = await Promise.all(
    worksheets.map(async (file, index) => {
      try {
        const result = await worksheetResultPromises[index];
        if (result.error) throw result.error;
        return redactNames(result.text.slice(0, MAX_REFERENCE_TEXT_LENGTH));
      } catch (error) {
        warnings.push(`수행평가지 ${index + 1}: ${safeMessage(error)}`);
        return "";
      }
    }),
  );

  reportProgress(95, "학생 명렬표 병합 완료");
  reportProgress(100, "분석 결과 반영 준비 완료");

  return NextResponse.json({
    roster,
    areas,
    evaluationPlanText,
    worksheetText: worksheetTexts.filter(Boolean).join("\n\n").slice(0, MAX_REFERENCE_TEXT_LENGTH),
    warnings,
  });
}

export function handleParseDocumentsStream(
  request: Request,
  dependencies: Omit<ParseDocumentsDependencies, "reportProgress">,
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (event: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      void handleParseDocuments(request, {
        ...dependencies,
        reportProgress: (event) => write({ type: "progress", ...event }),
      }).then(async (response) => {
        const data = await response.json();
        write({ type: "result", status: response.status, data });
        controller.close();
      }).catch((error: unknown) => {
        write({
          type: "result",
          status: 500,
          data: { code: "PARSE_FAILED", message: safeMessage(error) },
        });
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

export async function POST(request: Request) {
  if (request.headers.get("accept")?.includes("application/x-ndjson")) {
    return handleParseDocumentsStream(request, { requireActiveSubscription });
  }
  return handleParseDocuments(request, { requireActiveSubscription });
}
