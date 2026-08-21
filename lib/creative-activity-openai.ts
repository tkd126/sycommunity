import { z } from "zod";

import {
  annotateCreativeTimetableDates,
  isNaturalCreativeComment,
  normalizeCreativeActivities,
  normalizeCreativeDate,
  sanitizeCreativeComment,
} from "@/lib/creative-activity";
import type { ResponseCreator } from "@/lib/openai";
import {
  CREATIVE_CATEGORIES,
  type CreativeActivityRow,
  type CreativeCategory,
} from "@/types/creative-activity";

const DEFAULT_MODEL = "gpt-5.6-terra";

const rawActivitySchema = z
  .object({
    date: z.string().max(20),
    category: z.string().max(20),
    activity: z.string().min(1).max(200),
    hours: z.number().int().min(0).max(20),
    needsReview: z.boolean(),
  })
  .strict();

const parseResponseSchema = z
  .object({
    activities: z.array(rawActivitySchema),
    warnings: z.array(z.string().max(500)),
  })
  .strict();

const parseResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["activities", "warnings"],
  properties: {
    activities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["date", "category", "activity", "hours", "needsReview"],
        properties: {
          date: { type: "string", maxLength: 20 },
          category: { type: "string", maxLength: 20 },
          activity: { type: "string", minLength: 1, maxLength: 200 },
          hours: { type: "integer", minimum: 0, maximum: 20 },
          needsReview: { type: "boolean" },
        },
      },
    },
    warnings: {
      type: "array",
      items: { type: "string", maxLength: 500 },
    },
  },
} as const;

const creativeCommentInputSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .max(200)
      .refine((value) => value === value.trim()),
    date: z
      .string()
      .trim()
      .min(1)
      .max(20)
      .refine((value) => normalizeCreativeDate(value) !== null),
    category: z.enum(CREATIVE_CATEGORIES),
    activity: z.string().trim().min(1).max(200),
    hours: z.number().int().min(1).max(8),
  })
  .strict();

const generatedRowSchema = z
  .object({
    id: z.string().min(1).max(200),
    comment: z.string().min(60).max(1_000),
  })
  .strict();

const generateResponseSchema = z
  .object({
    rows: z.array(generatedRowSchema).min(1).max(50),
  })
  .strict();

const generateResponseJsonSchema = {
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
          id: { type: "string", minLength: 1, maxLength: 200 },
          comment: { type: "string", minLength: 60, maxLength: 1_000 },
        },
      },
    },
  },
} as const;

export type CreativeCommentInput = {
  id: string;
  date: string;
  category: CreativeCategory;
  activity: string;
  hours: number;
};

type TokenUsage = { inputTokens: number; outputTokens: number };

function requireUsage(response: Awaited<ReturnType<ResponseCreator["create"]>>): TokenUsage {
  const inputTokens = response.usage?.input_tokens;
  const outputTokens = response.usage?.output_tokens;
  if (
    typeof inputTokens !== "number"
    || typeof outputTokens !== "number"
    || !Number.isInteger(inputTokens)
    || !Number.isInteger(outputTokens)
    || inputTokens <= 0
    || outputTokens <= 0
  ) {
    throw new Error("OpenAI 응답의 토큰 사용량을 확인할 수 없습니다.");
  }
  return { inputTokens, outputTokens };
}

function parseJsonResponse(outputText: string): unknown {
  if (!outputText) {
    throw new Error("OpenAI 응답에 결과 JSON이 없습니다.");
  }

  try {
    return JSON.parse(outputText);
  } catch {
    throw new Error("OpenAI 응답이 올바른 JSON 형식이 아닙니다.");
  }
}

export async function parseCreativeActivities(
  text: string,
  creator: ResponseCreator,
  model = DEFAULT_MODEL,
): Promise<{
  activities: CreativeActivityRow[];
  warnings: string[];
  usage: TokenUsage;
}> {
  if (typeof text !== "string" || !text.trim() || text.length > 60_000) {
    throw new Error("시간표 텍스트는 1자 이상 60,000자 이하여야 합니다.");
  }

  const preparedText = annotateCreativeTimetableDates(text);
  const prompt = `다음은 한 학기 연간시간표에서 추출한 전체 텍스트이다.
주별 시간표 칸의 창체 약어와 오른쪽 비고란의 날짜 및 활동명을 반드시 함께 연결하고 한 영역만 따로 검색하지 마라.
창체는 창체, 자=자율, 봉=봉사, 진=진로로 해석하고 동·동아리·동아리활동은 제외하라.
같은 날짜의 서로 다른 활동은 별도 행으로 유지하라.
[확정 날짜 M/D]로 시작하는 활동 행은 문서에서 날짜와 활동이 같은 줄에 있었던 항목이다. date에는 해당 M/D를 그대로 쓰고 날짜 때문에 needsReview를 true로 만들지 마라.
날짜 속성에는 "확인 필요" 같은 설명 문구를 쓰지 마라.
날짜, 시수, 활동의 연결이 불확실하면 추측하지 말고 needsReview를 true로 표시하라.
학교명, 학급명, 교사명, 학생명은 결과에 포함하지 마라.

[시간표 추출 텍스트]
${preparedText}`;

  let response: Awaited<ReturnType<ResponseCreator["create"]>>;
  try {
    response = await creator.create({
      model,
      input: [{ role: "user", content: prompt }],
      reasoning: { effort: "none" },
      temperature: 0.2,
      max_output_tokens: 3000,
      text: {
        format: {
          type: "json_schema",
          name: "creative_activities",
          strict: true,
          schema: parseResponseJsonSchema,
        },
      },
    });
  } catch {
    throw new Error("시간표 구조화 요청에 실패했습니다.");
  }
  const usage = requireUsage(response);
  const validation = parseResponseSchema.safeParse(parseJsonResponse(response.output_text));
  if (!validation.success) {
    throw new Error("OpenAI 응답이 창체 활동 스키마와 일치하지 않습니다.");
  }

  return {
    activities: normalizeCreativeActivities(validation.data.activities),
    warnings: validation.data.warnings,
    usage,
  };
}

function fallbackCreativeComment(row: CreativeCommentInput): string {
  const activity = row.activity.trim();
  if (row.category === "진로") {
    return `${activity}에 참여하여 자신의 흥미와 적성을 구체적으로 살펴보고, 배운 내용을 바탕으로 앞으로의 진로 방향을 탐색함.`;
  }
  if (row.category === "봉사") {
    return `${activity}에 참여하여 활동의 목적과 필요성을 이해하고, 맡은 일을 책임감 있게 실천하며 공동체를 배려하는 태도를 기름.`;
  }
  return `${activity}에 참여하여 활동의 목적과 주요 내용을 차분히 이해하고, 공동체 생활에 필요한 책임감과 배려의 태도를 기름.`;
}

export async function generateCreativeComments(
  rows: CreativeCommentInput[],
  creator: ResponseCreator,
  model = DEFAULT_MODEL,
): Promise<{
  rows: Array<{ id: string; comment: string }>;
  usage: TokenUsage;
}> {
  const inputValidation = z.array(creativeCommentInputSchema).min(1).max(50).safeParse(rows);
  if (!inputValidation.success) {
    throw new Error("창체 평어 생성 입력이 올바르지 않습니다.");
  }

  const inputIds = inputValidation.data.map(({ id }) => id);
  if (new Set(inputIds).size !== inputIds.length) {
    throw new Error("창체 활동 id는 중복될 수 없습니다.");
  }

  const prompt = `교사가 확인한 창의적 체험활동마다 id별로 한국어 한 문장의 평어를 작성하라.
각 문장은 긍정적이고 자연스럽게 쓰며 명사형 종결어미로 끝내라.
문장 끝은 활동과 배움을 완결하는 "참여함", "익힘", "기름", "함양함", "이해함", "높임", "다짐함", "실천함", "탐색함" 가운데 문맥에 맞는 표현을 사용하라.
"과정임", "활동임", "형성임", "기반을 다지는 활동임"처럼 활동을 명명하기만 하는 어색한 종결은 절대 사용하지 마라.
"태도 형성임"이 아니라 "태도를 형성함", "하는 과정임"이 아니라 실제로 한 행동을 나타내는 "함"으로 완성하라.
"함을 보임", "익힘을 보임", "기름을 보임", "실천함을 다짐함", "기름을 다짐함", "높임을 다짐함", "이해함을 익힘", "보임함", "함함"처럼 이미 완성된 명사형 종결 뒤에 다른 종결을 덧붙이지 마라. "실천함", "기름", "높임", "이해함"에서 바로 문장을 끝내라.
"새 학기 준비 자세를 다짐함.", "올바른 위생 습관을 기름.", "긍정적인 대처 방법을 익힘."처럼 주어와 서술어의 호응이 자연스럽게 완성되도록 작성하라.
동일하거나 유사한 부사어 또는 서술어를 한 문장 안에서 반복하지 마라. "정확하게 이해하고 정확하게 해결함", "마음가짐을 다지고 자세를 다짐함"처럼 같은 표현이나 같은 뜻의 서술어를 되풀이하지 마라.
목적어와 서술어의 호응을 확인하라. "자기 이해를 익힘"은 쓰지 말고 문맥에 따라 "자신의 적성과 흥미를 이해함", "자기 이해를 높임", "진로 방향을 탐색함"처럼 자연스럽게 작성하라.
최종 JSON을 작성하기 전에 기본적인 국어 문법, 주어와 서술어의 호응, 목적어와 서술어의 호응, 부사어와 서술어의 중복 여부를 스스로 점검하라.
각 평어는 공백을 포함해 60자 이상 100자 이내로 충분히 구체적으로 작성하라.
활동의 과정과 참여 모습을 구체적으로 드러내는 두 절을 한 문장으로 자연스럽게 연결하라. 첫 절에는 어떤 활동에 어떻게 참여했는지 쓰고, 둘째 절에는 그 과정을 통해 무엇을 이해하거나 익히고 어떤 태도나 역량을 길렀는지 구체적으로 쓰되, 문장 끝은 앞에서 제시한 자연스러운 명사형 종결로 완성하라.
"무엇을 해서 무엇을 기름", "어떤 활동에 적극적으로 참여하며 무엇을 기름"과 같은 구조를 참고하되 모든 문장을 같은 표현으로 반복하지 마라.
"기본적인 이해를 보임", "잘 설명함"처럼 짧고 막연한 표현은 피하고, 무엇을 이해하거나 어떤 점을 명확하게 설명하는지 구체적으로 작성하라.
원문 활동에서 알 수 있는 학습, 참여, 태도의 의미 중 알맞은 내용을 포함하되 원문에 없는 사실은 만들지 마라.
원문에 없는 행사 참여, 수상, 학생의 능력이나 그 밖의 사실을 추측하거나 만들어 내지 마라.
외국어, 제품명과 불필요한 고유 명사는 일반적인 한국어 표현으로 바꾸라.
같은 날짜의 여러 활동도 합치지 말고 각 id별 별도 문장으로 작성하라.

[확인된 활동]
${JSON.stringify(inputValidation.data)}`;

  let response: Awaited<ReturnType<ResponseCreator["create"]>>;
  try {
    response = await creator.create({
      model,
      input: [{ role: "user", content: prompt }],
      reasoning: { effort: "none" },
      temperature: 0.2,
      max_output_tokens: 5000,
      text: {
        format: {
          type: "json_schema",
          name: "creative_comments",
          strict: true,
          schema: generateResponseJsonSchema,
        },
      },
    });
  } catch {
    throw new Error("창체 평어 생성 요청에 실패했습니다.");
  }
  const usage = requireUsage(response);
  const validation = generateResponseSchema.safeParse(parseJsonResponse(response.output_text));
  if (!validation.success) {
    throw new Error("OpenAI 응답이 창체 평어 스키마와 일치하지 않습니다.");
  }

  const responseIds = validation.data.rows.map(({ id }) => id);
  const responseIdSet = new Set(responseIds);
  const requestedIdSet = new Set(inputIds);
  const idsMatch = responseIdSet.size === responseIds.length
    && responseIdSet.size === requestedIdSet.size
    && [...requestedIdSet].every((id) => responseIdSet.has(id));
  if (!idsMatch) {
    throw new Error("창체 활동 id가 요청과 정확히 일치하지 않습니다.");
  }

  const inputById = new Map(inputValidation.data.map((row) => [row.id, row]));
  const sanitizedRows = validation.data.rows.map(({ id, comment }) => {
    const sanitizedComment = sanitizeCreativeComment(comment);
    const inputRow = inputById.get(id);
    if (!inputRow) {
      throw new Error("창체 활동 id가 요청과 정확히 일치하지 않습니다.");
    }
    const safeComment = isNaturalCreativeComment(sanitizedComment)
      ? sanitizedComment
      : sanitizeCreativeComment(fallbackCreativeComment(inputRow));

    return { id, comment: safeComment };
  });
  if (sanitizedRows.some(({ comment }) => !isNaturalCreativeComment(comment))) {
    throw new Error("OpenAI 응답의 창체 평어를 안전하게 정제할 수 없습니다.");
  }

  return { rows: sanitizedRows, usage };
}
