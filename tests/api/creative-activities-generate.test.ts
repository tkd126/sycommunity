import { describe, expect, it, vi } from "vitest";

import {
  handleGenerateCreativeActivities,
  handleGenerateCreativeActivitiesPost,
} from "@/app/api/creative-activities/generate/handler";
import { generateCreativeComments } from "@/lib/creative-activity-openai";

const PRIVATE_ACTIVITY = "학생회 비밀 선거 준비";
const PRIVATE_PASSWORD = "teacher-password";
const PRIVATE_PROMPT = "internal creative comment prompt";

const validRows = [
  {
    id: "activity-1",
    date: "3/4",
    category: "자율" as const,
    activity: PRIVATE_ACTIVITY,
    hours: 1,
  },
  {
    id: "activity-2",
    date: "3/4",
    category: "진로" as const,
    activity: "진로 탐색 발표",
    hours: 2,
  },
];

const validBody = {
  password: PRIVATE_PASSWORD,
  rows: validRows,
};

function activeAccess() {
  return vi.fn().mockResolvedValue({
    ok: true,
    userId: "user-1",
    email: "teacher@example.com",
    role: "teacher",
  } as const);
}

function jsonRequest(
  body: unknown = validBody,
  options: { headers?: Record<string, string>; rawBody?: string } = {},
) {
  return new Request("http://localhost/api/creative-activities/generate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
    body: options.rawBody ?? JSON.stringify(body),
  });
}

function baseDependencies(overrides: Record<string, unknown> = {}) {
  return {
    config: {
      teacherAccessPassword: PRIVATE_PASSWORD,
      monthlyBudgetKrw: 30_000,
      model: "gpt-5.6-terra",
      usdKrwRate: 1_400,
      inputPricePer1MUsd: 0.4,
      outputPricePer1MUsd: 1.6,
    },
    requireActiveSubscription: activeAccess(),
    allowRequest: vi.fn().mockReturnValue(true),
    getMonthlyUsageKrw: vi.fn().mockResolvedValue(1_000),
    generateCreativeComments: vi.fn().mockImplementation(async (rows) => ({
      rows: rows.map(({ id }: { id: string }) => ({ id, comment: `${id} 평어` })),
      usage: { inputTokens: 100, outputTokens: 50 },
    })),
    calculateCostKrw: vi.fn().mockReturnValue(3),
    saveUsageEvent: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function baseRuntimeDependencies(overrides: Record<string, unknown> = {}) {
  const creator = { create: vi.fn() };
  return {
    env: {},
    requireActiveSubscription: activeAccess(),
    readServerConfig: vi.fn().mockReturnValue({
      apiKey: "test-api-key",
      model: "gpt-5.6-terra",
      monthlyBudgetKrw: 30_000,
      usdKrwRate: 1_400,
      inputPricePer1MUsd: 0.4,
      outputPricePer1MUsd: 1.6,
      teacherAccessPassword: PRIVATE_PASSWORD,
      databaseUrl: "file:test.db",
    }),
    createResponseCreator: vi.fn().mockReturnValue(creator),
    allowRequest: vi.fn().mockReturnValue(true),
    getMonthlyUsageKrw: vi.fn().mockResolvedValue(1_000),
    generateCreativeCommentsWithOpenAi: vi.fn().mockResolvedValue({
      rows: validRows.map(({ id }) => ({ id, comment: `${id} 평어` })),
      usage: { inputTokens: 100, outputTokens: 50 },
    }),
    calculateCostKrw: vi.fn().mockReturnValue(3),
    saveUsageEvent: vi.fn().mockResolvedValue(undefined),
    creator,
    ...overrides,
  };
}

async function generate(body: unknown = validBody, overrides: Record<string, unknown> = {}) {
  const dependencies = baseDependencies(overrides);
  const response = await handleGenerateCreativeActivities(jsonRequest(body), dependencies);
  return { response, body: await response.json(), dependencies };
}

describe("POST /api/creative-activities/generate", () => {
  it("같은 날짜의 서로 다른 id를 각각 생성하고 사용량을 한 번만 저장한다", async () => {
    const { response, body, dependencies } = await generate();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      rows: [
        { id: "activity-1", comment: "activity-1 평어" },
        { id: "activity-2", comment: "activity-2 평어" },
      ],
      usage: { amountKrw: 1_003, budgetKrw: 30_000 },
    });
    expect(dependencies.generateCreativeComments).toHaveBeenCalledWith(validRows, "gpt-5.6-terra");
    expect(dependencies.calculateCostKrw).toHaveBeenCalledWith(
      { inputTokens: 100, outputTokens: 50 },
      {
        usdKrwRate: 1_400,
        inputPricePer1MUsd: 0.4,
        outputPricePer1MUsd: 1.6,
      },
    );
    expect(dependencies.saveUsageEvent).toHaveBeenCalledTimes(1);
    expect(dependencies.saveUsageEvent).toHaveBeenCalledWith({
      inputTokens: 100,
      outputTokens: 50,
      costKrw: 3,
      model: "gpt-5.6-terra",
    });
  });

  it.each([
    ["루트 null", null],
    ["루트 배열", []],
    ["루트 추가 필드", { ...validBody, rawText: "private source" }],
    ["비밀번호 누락", { rows: validRows }],
    ["빈 비밀번호", { ...validBody, password: "" }],
    ["201자 비밀번호", { ...validBody, password: "p".repeat(201) }],
    ["행 누락", { password: PRIVATE_PASSWORD }],
    ["빈 행", { ...validBody, rows: [] }],
    ["51개 행", { ...validBody, rows: Array.from({ length: 51 }, (_, index) => ({ ...validRows[0], id: `id-${index}` })) }],
    ["행 null", { ...validBody, rows: [null] }],
    ["행 추가 필드", { ...validBody, rows: [{ ...validRows[0], unexpected: true }] }],
    ["needsReview", { ...validBody, rows: [{ ...validRows[0], needsReview: false }] }],
    ["학생 이름", { ...validBody, rows: [{ ...validRows[0], studentName: "김학생" }] }],
    ["name", { ...validBody, rows: [{ ...validRows[0], name: "김학생" }] }],
    ["email", { ...validBody, rows: [{ ...validRows[0], email: "student@example.com" }] }],
    ["원본 파일", { ...validBody, rows: [{ ...validRows[0], file: "source.hwpx" }] }],
    ["원본 텍스트", { ...validBody, rows: [{ ...validRows[0], text: "raw private text" }] }],
    ["빈 id", { ...validBody, rows: [{ ...validRows[0], id: "" }] }],
    ["공백 id", { ...validBody, rows: [{ ...validRows[0], id: " id " }] }],
    ["101자 id", { ...validBody, rows: [{ ...validRows[0], id: "i".repeat(101) }] }],
    ["중복 id", { ...validBody, rows: [{ ...validRows[0] }, { ...validRows[1], id: validRows[0].id }] }],
    ["00월", { ...validBody, rows: [{ ...validRows[0], date: "00/04" }] }],
    ["13월", { ...validBody, rows: [{ ...validRows[0], date: "13/01" }] }],
    ["0일", { ...validBody, rows: [{ ...validRows[0], date: "3/0" }] }],
    ["32일", { ...validBody, rows: [{ ...validRows[0], date: "02/32" }] }],
    ["존재하지 않는 날짜", { ...validBody, rows: [{ ...validRows[0], date: "02/30" }] }],
    ["잘못된 영역", { ...validBody, rows: [{ ...validRows[0], category: "동아리" }] }],
    ["빈 활동", { ...validBody, rows: [{ ...validRows[0], activity: "   " }] }],
    ["201자 활동", { ...validBody, rows: [{ ...validRows[0], activity: "가".repeat(201) }] }],
    ["0시간", { ...validBody, rows: [{ ...validRows[0], hours: 0 }] }],
    ["9시간", { ...validBody, rows: [{ ...validRows[0], hours: 9 }] }],
    ["소수 시간", { ...validBody, rows: [{ ...validRows[0], hours: 1.5 }] }],
  ])("잘못된 요청 본문을 거부한다: %s", async (_name, body) => {
    const { response, dependencies } = await generate(body);

    expect(response.status).toBe(400);
    expect(dependencies.allowRequest).not.toHaveBeenCalled();
    expect(dependencies.getMonthlyUsageKrw).not.toHaveBeenCalled();
    expect(dependencies.generateCreativeComments).not.toHaveBeenCalled();
  });

  it("reports the row limit instead of a missing-input error for more than 50 rows", async () => {
    const rows = Array.from({ length: 51 }, (_, index) => ({ ...validRows[0], id: `id-${index}` }));
    const { response, body } = await generate({ ...validBody, rows });

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      code: "TOO_MANY_ROWS",
      message: "\uD3C9\uC5B4\uB294 \uD55C \uBC88\uC5D0 \uCD5C\uB300 50\uAC1C\uAE4C\uC9C0 \uC0DD\uC131\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    });
  });

  it("활동의 앞뒤 공백은 제거하고 200자 경계를 허용한다", async () => {
    const row = { ...validRows[0], activity: `  ${"가".repeat(200)}  ` };
    const { response, dependencies } = await generate({ ...validBody, rows: [row] });

    expect(response.status).toBe(200);
    expect(dependencies.generateCreativeComments).toHaveBeenCalledWith(
      [{ ...row, activity: "가".repeat(200) }],
      "gpt-5.6-terra",
    );
  });

  it("0을 채운 한두 자리 M/D 날짜를 정규화하지 않고 허용한다", async () => {
    const row = { ...validRows[0], date: "03/04" };
    const { response, dependencies } = await generate({ ...validBody, rows: [row] });

    expect(response.status).toBe(200);
    expect(dependencies.generateCreativeComments).toHaveBeenCalledWith(
      [row],
      "gpt-5.6-terra",
    );
  });

  it.each([
    ["깨진 JSON", "{"],
    ["빈 본문", ""],
  ])("JSON 본문 형식을 검증한다: %s", async (_name, rawBody) => {
    const dependencies = baseDependencies();
    const response = await handleGenerateCreativeActivities(
      jsonRequest(undefined, { rawBody }),
      dependencies,
    );

    expect(response.status).toBe(400);
    expect(dependencies.generateCreativeComments).not.toHaveBeenCalled();
  });

  it("content-length가 100,000자를 넘으면 본문을 읽지 않고 413을 반환한다", async () => {
    const dependencies = baseDependencies();
    const text = vi.fn();
    const request = {
      headers: new Headers({ "content-length": "100001", "content-type": "application/json" }),
      text,
    } as unknown as Request;

    const response = await handleGenerateCreativeActivities(request, dependencies);

    expect(response.status).toBe(413);
    expect(text).not.toHaveBeenCalled();
  });

  it("실제 본문은 100,000자를 허용하고 100,001자는 413으로 거부한다", async () => {
    const compact = JSON.stringify({ ...validBody, rows: [validRows[0]] });
    const exact = compact + " ".repeat(100_000 - compact.length);
    const exactDependencies = baseDependencies();
    const exactResponse = await handleGenerateCreativeActivities(
      jsonRequest(undefined, { rawBody: exact }),
      exactDependencies,
    );
    const oversizedDependencies = baseDependencies();
    const oversizedResponse = await handleGenerateCreativeActivities(
      jsonRequest(undefined, { rawBody: `${exact} ` }),
      oversizedDependencies,
    );

    expect(exactResponse.status).toBe(200);
    expect(oversizedResponse.status).toBe(413);
    expect(oversizedDependencies.generateCreativeComments).not.toHaveBeenCalled();
  });

  it.each([
    [401, { ok: false, status: 401, code: "AUTH_REQUIRED", message: "로그인이 필요합니다." }],
    [403, { ok: false, status: 403, code: "SUBSCRIPTION_REQUIRED", message: "승인이 필요합니다." }],
  ])("인증 실패 %i를 본문 처리보다 먼저 반환한다", async (status, access) => {
    const dependencies = baseDependencies({
      requireActiveSubscription: vi.fn().mockResolvedValue(access),
    });
    const text = vi.fn();
    const request = { headers: new Headers(), text } as unknown as Request;

    const response = await handleGenerateCreativeActivities(request, dependencies);

    expect(response.status).toBe(status);
    expect(text).not.toHaveBeenCalled();
    expect(dependencies.allowRequest).not.toHaveBeenCalled();
    expect(dependencies.getMonthlyUsageKrw).not.toHaveBeenCalled();
    expect(dependencies.generateCreativeComments).not.toHaveBeenCalled();
  });

  it("인증 확인 예외를 비밀값 없는 일반 503으로 바꾼다", async () => {
    const sourceError = `${PRIVATE_ACTIVITY} ${PRIVATE_PASSWORD} ${PRIVATE_PROMPT}`;
    const { response, body, dependencies } = await generate(validBody, {
      requireActiveSubscription: vi.fn().mockRejectedValue(new Error(sourceError)),
    });

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ code: "AUTH_UNAVAILABLE" });
    expect(JSON.stringify(body)).not.toMatch(new RegExp(`${PRIVATE_ACTIVITY}|${PRIVATE_PASSWORD}|${PRIVATE_PROMPT}`));
    expect(dependencies.generateCreativeComments).not.toHaveBeenCalled();
  });

  it("잘못된 비밀번호에서 이후 게이트를 호출하지 않는다", async () => {
    const { response, dependencies } = await generate(
      { ...validBody, password: "wrong-password" },
    );

    expect(response.status).toBe(401);
    expect(dependencies.allowRequest).not.toHaveBeenCalled();
    expect(dependencies.getMonthlyUsageKrw).not.toHaveBeenCalled();
    expect(dependencies.generateCreativeComments).not.toHaveBeenCalled();
  });

  it("IP 요청 제한에서 사용량과 생성기를 호출하지 않는다", async () => {
    const { response, dependencies } = await generate(validBody, {
      allowRequest: vi.fn().mockReturnValue(false),
    });

    expect(response.status).toBe(429);
    expect(dependencies.getMonthlyUsageKrw).not.toHaveBeenCalled();
    expect(dependencies.generateCreativeComments).not.toHaveBeenCalled();
  });

  it("월 사용량 조회 실패를 일반 503으로 반환한다", async () => {
    const { response, body, dependencies } = await generate(validBody, {
      getMonthlyUsageKrw: vi.fn().mockRejectedValue(new Error(PRIVATE_ACTIVITY)),
    });

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ code: "USAGE_UNAVAILABLE" });
    expect(JSON.stringify(body)).not.toContain(PRIVATE_ACTIVITY);
    expect(dependencies.generateCreativeComments).not.toHaveBeenCalled();
  });

  it("월 사용량이 한도와 같으면 생성기를 호출하지 않는다", async () => {
    const { response, dependencies } = await generate(validBody, {
      getMonthlyUsageKrw: vi.fn().mockResolvedValue(30_000),
    });

    expect(response.status).toBe(429);
    expect(dependencies.generateCreativeComments).not.toHaveBeenCalled();
  });

  it("생성기에는 허용된 다섯 필드와 설정 모델만 전달한다", async () => {
    const { response, dependencies } = await generate({
      password: PRIVATE_PASSWORD,
      rows: [{ ...validRows[0], activity: ` ${validRows[0].activity} ` }],
    });

    expect(response.status).toBe(200);
    expect(dependencies.generateCreativeComments).toHaveBeenCalledWith(
      [{
        id: "activity-1",
        date: "3/4",
        category: "자율",
        activity: PRIVATE_ACTIVITY,
        hours: 1,
      }],
      "gpt-5.6-terra",
    );
    expect(Object.keys(dependencies.generateCreativeComments.mock.calls[0][0][0])).toEqual([
      "id",
      "date",
      "category",
      "activity",
      "hours",
    ]);
  });

  it("생성 실패의 활동·비밀번호·프롬프트를 노출하지 않고 일반 502를 반환한다", async () => {
    const sourceError = `${PRIVATE_ACTIVITY} ${PRIVATE_PASSWORD} ${PRIVATE_PROMPT}`;
    const { response, body, dependencies } = await generate(validBody, {
      generateCreativeComments: vi.fn().mockRejectedValue(new Error(sourceError)),
    });

    expect(response.status).toBe(502);
    expect(body).toMatchObject({ code: "GENERATION_FAILED" });
    expect(JSON.stringify(body)).not.toMatch(new RegExp(`${PRIVATE_ACTIVITY}|${PRIVATE_PASSWORD}|${PRIVATE_PROMPT}`));
    expect(dependencies.saveUsageEvent).not.toHaveBeenCalled();
  });

  it("사용량 저장 실패 시 성공 행 없이 일반 503을 반환한다", async () => {
    const { response, body } = await generate(validBody, {
      saveUsageEvent: vi.fn().mockRejectedValue(new Error(`${PRIVATE_ACTIVITY} activity-1 평어`)),
    });

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ code: "USAGE_SAVE_FAILED" });
    expect(body).not.toHaveProperty("rows");
    expect(JSON.stringify(body)).not.toMatch(new RegExp(`${PRIVATE_ACTIVITY}|activity-1 평어`));
  });

  it("응답에는 id/comment 행과 사용량만 포함한다", async () => {
    const { body } = await generate();

    expect(Object.keys(body).sort()).toEqual(["rows", "usage"]);
    expect(Object.keys(body.rows[0]).sort()).toEqual(["comment", "id"]);
    expect(Object.keys(body.usage).sort()).toEqual(["amountKrw", "budgetKrw"]);
    expect(JSON.stringify(body)).not.toMatch(
      new RegExp(`${PRIVATE_ACTIVITY}|${PRIVATE_PASSWORD}|3/4|internal|prompt|output_text`),
    );
  });
});

describe("creative activities generate runtime", () => {
  it.each([
    ["인증 거절", vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      code: "SUBSCRIPTION_REQUIRED",
      message: "승인이 필요합니다.",
    })],
    ["비동기 인증 예외", vi.fn().mockRejectedValue(new Error(`${PRIVATE_ACTIVITY} ${PRIVATE_PASSWORD}`))],
  ])("%s를 설정과 OpenAI 초기화보다 먼저 처리한다", async (name, auth) => {
    const dependencies = baseRuntimeDependencies({ requireActiveSubscription: auth });

    const response = await handleGenerateCreativeActivitiesPost(jsonRequest(), dependencies);
    const body = await response.json();

    expect(response.status).toBe(name === "인증 거절" ? 403 : 503);
    if (name === "비동기 인증 예외") {
      expect(body).toMatchObject({ code: "AUTH_UNAVAILABLE" });
      expect(JSON.stringify(body)).not.toMatch(new RegExp(`${PRIVATE_ACTIVITY}|${PRIVATE_PASSWORD}`));
    }
    expect(dependencies.readServerConfig).not.toHaveBeenCalled();
    expect(dependencies.createResponseCreator).not.toHaveBeenCalled();
    expect(dependencies.allowRequest).not.toHaveBeenCalled();
    expect(dependencies.getMonthlyUsageKrw).not.toHaveBeenCalled();
    expect(dependencies.generateCreativeCommentsWithOpenAi).not.toHaveBeenCalled();
  });

  it("인증 뒤 설정을 읽고 모든 게이트 통과 뒤 OpenAI 생성기를 지연 생성한다", async () => {
    const dependencies = baseRuntimeDependencies();

    const response = await handleGenerateCreativeActivitiesPost(jsonRequest(), dependencies);

    expect(response.status).toBe(200);
    expect(dependencies.requireActiveSubscription).toHaveBeenCalledTimes(1);
    expect(dependencies.requireActiveSubscription.mock.invocationCallOrder[0]).toBeLessThan(
      dependencies.readServerConfig.mock.invocationCallOrder[0],
    );
    expect(dependencies.getMonthlyUsageKrw.mock.invocationCallOrder[0]).toBeLessThan(
      dependencies.createResponseCreator.mock.invocationCallOrder[0],
    );
    expect(dependencies.createResponseCreator).toHaveBeenCalledWith("test-api-key");
    expect(dependencies.generateCreativeCommentsWithOpenAi).toHaveBeenCalledWith(
      validRows,
      dependencies.creator,
      "gpt-5.6-terra",
    );
  });

  it.each([
    ["잘못된 비밀번호", { ...validBody, password: "wrong" }, {}],
    ["요청 제한", validBody, { allowRequest: vi.fn().mockReturnValue(false) }],
    ["사용량 조회 실패", validBody, { getMonthlyUsageKrw: vi.fn().mockRejectedValue(new Error("db")) }],
    ["월 한도", validBody, { getMonthlyUsageKrw: vi.fn().mockResolvedValue(30_000) }],
  ])("%s에서는 OpenAI 생성기를 만들지 않는다", async (_name, body, overrides) => {
    const dependencies = baseRuntimeDependencies(overrides);

    await handleGenerateCreativeActivitiesPost(jsonRequest(body), dependencies);

    expect(dependencies.createResponseCreator).not.toHaveBeenCalled();
    expect(dependencies.generateCreativeCommentsWithOpenAi).not.toHaveBeenCalled();
  });

  it.each([
    ["누락 id", [{ id: "activity-1", comment: "책임감 있게 참여함" }]],
    ["중복 id", [
      { id: "activity-1", comment: "책임감 있게 참여함" },
      { id: "activity-1", comment: "적극적으로 참여함" },
    ]],
    ["알 수 없는 id", [
      { id: "activity-1", comment: "책임감 있게 참여함" },
      { id: "private-unknown-id", comment: "적극적으로 참여함" },
    ]],
  ])("실제 Task 5 어댑터의 %s 거절을 비밀값 없는 502로 변환한다", async (_name, rows) => {
    const responseCreator = {
      create: vi.fn().mockResolvedValue({
        output_text: JSON.stringify({ rows }),
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    };
    const dependencies = baseRuntimeDependencies({
      createResponseCreator: vi.fn().mockReturnValue(responseCreator),
      generateCreativeCommentsWithOpenAi: generateCreativeComments,
    });

    const response = await handleGenerateCreativeActivitiesPost(jsonRequest(), dependencies);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      code: "GENERATION_FAILED",
      message: "평어 생성 결과를 확인하지 못했습니다.",
    });
    expect(JSON.stringify(body)).not.toMatch(
      new RegExp(`${PRIVATE_ACTIVITY}|${PRIVATE_PASSWORD}|${PRIVATE_PROMPT}|private-unknown-id`),
    );
    expect(responseCreator.create).toHaveBeenCalledTimes(1);
    expect(dependencies.saveUsageEvent).not.toHaveBeenCalled();
  });
});
