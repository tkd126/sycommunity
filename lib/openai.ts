import OpenAI from "openai";
import { z } from "zod";

import { buildReportPrompt } from "@/lib/prompt";
import { sanitizeComment } from "@/lib/sanitize";

const levelSchema = z.enum(["매우 잘함", "잘함", "보통", "노력 요함"]);

export const generateReportRequestSchema = z
  .object({
    password: z.string().min(1).max(200),
    subject: z.string().min(1).max(30),
    areaCount: z.number().int().min(1).max(10),
    students: z
      .array(
        z
          .object({
            studentNumber: z.number().int().positive(),
            levels: z
              .array(
                z
                  .object({ areaName: z.string().min(1).max(100), level: levelSchema })
                  .strict(),
              )
              .min(1)
              .max(10),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    evaluationPlan: z.string().max(30_000),
    worksheets: z.string().max(30_000),
    example: z.string().max(10_000),
    instruction: z.string().max(5_000),
  })
  .strict()
  .superRefine((value, context) => {
    value.students.forEach((student, index) => {
      if (student.levels.length !== value.areaCount) {
        context.addIssue({
          code: "custom",
          path: ["students", index, "levels"],
          message: "학생별 선택 영역 수가 평어 반영 영역 수와 일치해야 합니다.",
        });
      }
    });
  });

export type GenerateReportRequest = z.infer<typeof generateReportRequestSchema>;

const reportResponseSchema = z
  .object({
    subject: z.string(),
    warning: z.string(),
    rows: z.array(
      z
        .object({
          studentNumber: z.number().int().positive(),
          selectedLevels: z.string().min(1),
          areaComments: z
            .array(
              z
                .object({
                  areaName: z.string().min(1),
                  comment: z.string().min(1),
                })
                .strict(),
            )
            .min(1)
            .max(10),
        })
        .strict(),
    ),
  })
  .strict();

const reportResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["subject", "warning", "rows"],
  properties: {
    subject: { type: "string" },
    warning: { type: "string" },
    rows: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["studentNumber", "selectedLevels", "areaComments"],
        properties: {
          studentNumber: { type: "integer" },
          selectedLevels: { type: "string" },
          areaComments: {
            type: "array",
            minItems: 1,
            maxItems: 10,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["areaName", "comment"],
              properties: {
                areaName: { type: "string" },
                comment: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;

type OpenAiLikeResponse = {
  output_text: string;
  usage?: { input_tokens?: number; output_tokens?: number } | null;
};

export type ResponseCreator = {
  create(params: Record<string, unknown>): Promise<OpenAiLikeResponse>;
};

export function createResponseCreator(apiKey: string): ResponseCreator {
  const client = new OpenAI({ apiKey });
  return {
    async create(params) {
      return (await client.responses.create(
        params as Parameters<typeof client.responses.create>[0],
      )) as OpenAiLikeResponse;
    },
  };
}

export function getReportOutputTokenLimit(studentCount: number, areaCount = 3): number {
  return Math.min(5000, Math.max(800, 500 + studentCount * areaCount * 100));
}

function sanitizeSingleAreaComment(input: string): string {
  const sanitized = sanitizeComment(input);
  const clauses = sanitized
    .split(/\.+/g)
    .map((clause) => clause.trim())
    .filter(Boolean);
  if (clauses.length === 0) throw new Error("영역별 평어가 비어 있습니다.");
  return `${clauses.join(", ")}.`;
}

export async function generateReports(
  rawInput: GenerateReportRequest,
  creator: ResponseCreator,
  model = "gpt-5.6-terra",
) {
  const input = generateReportRequestSchema.parse(rawInput);
  const { password: _password, ...promptInput } = input;
  const prompt = buildReportPrompt(promptInput);

  const response = await creator.create({
    model,
    input: [{ role: "user", content: prompt }],
    reasoning: { effort: "none" },
    temperature: 0.4,
    max_output_tokens: getReportOutputTokenLimit(input.students.length, input.areaCount),
    text: {
      format: {
        type: "json_schema",
        name: "report_rows",
        strict: true,
        schema: reportResponseJsonSchema,
      },
    },
  });

  if (!response.output_text) throw new Error("OpenAI 응답에 결과 JSON이 없습니다.");
  if (!response.usage?.input_tokens || !response.usage.output_tokens) {
    throw new Error("OpenAI 응답에서 토큰 사용량을 확인하지 못했습니다.");
  }

  let json: unknown;
  try {
    json = JSON.parse(response.output_text);
  } catch {
    throw new Error("OpenAI 응답이 올바른 JSON 형식이 아닙니다.");
  }

  const parsed = reportResponseSchema.parse(json);
  const requestedNumbers = input.students.map(({ studentNumber }) => studentNumber).sort((a, b) => a - b);
  const responseNumbers = parsed.rows.map(({ studentNumber }) => studentNumber).sort((a, b) => a - b);
  if (JSON.stringify(requestedNumbers) !== JSON.stringify(responseNumbers)) {
    throw new Error("학생 번호가 요청과 일치하지 않습니다.");
  }

  const inputByStudentNumber = new Map(input.students.map((student) => [student.studentNumber, student]));
  const rows = parsed.rows.map((row) => {
    const inputStudent = inputByStudentNumber.get(row.studentNumber);
    if (!inputStudent) throw new Error("학생 번호가 요청과 일치하지 않습니다.");

    const expectedAreaNames = inputStudent.levels.map(({ areaName }) => areaName);
    if (row.areaComments.length !== expectedAreaNames.length) {
      throw new Error("영역별 평어 수가 선택 영역 수와 일치하지 않습니다.");
    }
    const commentsByAreaName = new Map(row.areaComments.map((item) => [item.areaName, item.comment]));
    if (commentsByAreaName.size !== expectedAreaNames.length
      || !expectedAreaNames.every((areaName) => commentsByAreaName.has(areaName))) {
      throw new Error("영역별 평어가 선택 영역과 일치하지 않습니다.");
    }

    return {
      studentNumber: row.studentNumber,
      selectedLevels: inputStudent.levels.map(({ areaName, level }) => `${areaName} ${level}`).join("\n"),
      comment: expectedAreaNames
        .map((areaName) => sanitizeSingleAreaComment(commentsByAreaName.get(areaName) ?? ""))
        .join(" "),
    };
  });

  return {
    subject: parsed.subject,
    warning: parsed.warning,
    rows,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
