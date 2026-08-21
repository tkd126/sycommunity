import { z } from "zod";

import type { ResponseCreator } from "@/lib/openai";
import { sanitizeComment } from "@/lib/sanitize";

const proofreadRowSchema = z.object({
  id: z.string().min(1).max(120),
  comment: z.string().trim().min(1).max(2_000),
}).strict();

export const proofreadRequestSchema = z.object({
  password: z.string().min(1).max(200),
  rows: z.array(proofreadRowSchema).min(1).max(50),
}).strict().superRefine((value, context) => {
  const ids = new Set(value.rows.map((row) => row.id));
  if (ids.size !== value.rows.length) {
    context.addIssue({ code: "custom", path: ["rows"], message: "행 식별자는 중복될 수 없습니다." });
  }
  if (value.rows.reduce((sum, row) => sum + row.comment.length, 0) > 30_000) {
    context.addIssue({ code: "custom", path: ["rows"], message: "검사할 전체 문장이 너무 깁니다." });
  }
});

export type ProofreadRequest = z.infer<typeof proofreadRequestSchema>;

const proofreadResponseSchema = z.object({
  rows: z.array(proofreadRowSchema).min(1).max(50),
}).strict();

const proofreadResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["rows"],
  properties: {
    rows: {
      type: "array",
      minItems: 1,
      maxItems: 50,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "comment"],
        properties: {
          id: { type: "string" },
          comment: { type: "string" },
        },
      },
    },
  },
} as const;

function buildProofreadPrompt(rows: ProofreadRequest["rows"]): string {
  return [
    "너는 초등학교 생활기록부 한국어 문장 교정자다.",
    "각 문장의 맞춤법, 띄어쓰기, 조사 호응, 문법, 한 문장 안의 중복 부사어와 중복 서술어만 자연스럽게 교정한다.",
    "원문에 없는 사실이나 평가 수준을 추가하거나 삭제하지 않는다.",
    "원문의 문장 수와 명사형 종결 어미인 함, 됨, 보임, 익힘, 기름, 다짐을 유지한다.",
    "제품명과 고유명사를 새로 만들지 않는다.",
    "행 식별자 id는 절대 바꾸지 않는다.",
    "JSON 이외의 설명은 출력하지 않는다.",
    JSON.stringify({ rows }),
  ].join("\n");
}

export async function proofreadComments(
  rawInput: ProofreadRequest,
  creator: Pick<ResponseCreator, "create">,
  model = "gpt-5.6-terra",
) {
  const input = proofreadRequestSchema.parse(rawInput);
  const response = await creator.create({
    model,
    input: [{ role: "user", content: buildProofreadPrompt(input.rows) }],
    reasoning: { effort: "none" },
    temperature: 0.1,
    max_output_tokens: Math.min(4_000, Math.max(500, 250 + input.rows.length * 100)),
    text: {
      format: {
        type: "json_schema",
        name: "proofread_rows",
        strict: true,
        schema: proofreadResponseJsonSchema,
      },
    },
  });

  if (!response.output_text) throw new Error("교정 응답에 결과 JSON이 없습니다.");
  if (!response.usage?.input_tokens || !response.usage.output_tokens) {
    throw new Error("교정 응답에서 토큰 사용량을 확인하지 못했습니다.");
  }

  let json: unknown;
  try {
    json = JSON.parse(response.output_text);
  } catch {
    throw new Error("교정 응답이 올바른 JSON 형식이 아닙니다.");
  }

  const parsed = proofreadResponseSchema.parse(json);
  const requestedIds = input.rows.map((row) => row.id).sort();
  const responseIds = parsed.rows.map((row) => row.id).sort();
  if (new Set(responseIds).size !== responseIds.length
    || JSON.stringify(requestedIds) !== JSON.stringify(responseIds)) {
    throw new Error("교정 결과 행이 요청과 일치하지 않습니다.");
  }

  const commentsById = new Map(parsed.rows.map((row) => [row.id, sanitizeComment(row.comment)]));
  return {
    rows: input.rows.map((row) => ({ id: row.id, comment: commentsById.get(row.id) ?? row.comment })),
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
