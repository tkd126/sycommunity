import { File as NodeFile } from "node:buffer";
import { describe, expect, it, vi } from "vitest";

import {
  handleParseCreativeActivities,
  handleParseCreativeActivitiesPost,
} from "@/app/api/creative-activities/parse/handler";

const TEN_MB = 10 * 1024 * 1024;
const ELEVEN_MB = 11 * 1024 * 1024;
const PRIVATE_SOURCE = "절대 노출되면 안 되는 원문";
const PRIVATE_FILE_NAME = "서울초등학교-5학년2반-김교사.hwpx";
const PRIVATE_PROMPT = "internal parser prompt";
const PRIVATE_MODEL_ERROR = "upstream model leaked private data";

type FormValue = string | NodeFile;

class TestFormData {
  private readonly values = new Map<string, FormValue[]>();

  append(key: string, value: FormValue) {
    this.values.set(key, [...(this.values.get(key) ?? []), value]);
  }

  get(key: string) {
    return this.values.get(key)?.[0] ?? null;
  }

  getAll(key: string) {
    return this.values.get(key) ?? [];
  }

  *entries() {
    for (const [key, values] of this.values) {
      for (const value of values) yield [key, value] as [string, FormValue];
    }
  }
}

function activeAccess() {
  return vi.fn().mockResolvedValue({
    ok: true,
    userId: "user-1",
    email: "teacher@example.com",
    role: "teacher",
  } as const);
}

function validForm(fileName = "시간표.hwpx", contents: string | Uint8Array = "synthetic") {
  const form = new TestFormData();
  form.append("password", "teacher-password");
  form.append("file", new NodeFile([contents], fileName));
  return form;
}

function requestFrom(
  form: TestFormData,
  options: { headers?: Record<string, string>; formData?: () => Promise<FormData> } = {},
) {
  return {
    headers: new Headers(options.headers),
    formData: options.formData ?? (async () => form as unknown as FormData),
  } as Request;
}

function baseDependencies(overrides: Record<string, unknown> = {}) {
  return {
    config: {
      teacherAccessPassword: "teacher-password",
      monthlyBudgetKrw: 30_000,
      model: "gpt-5.6-terra",
      usdKrwRate: 1_400,
      inputPricePer1MUsd: 0.4,
      outputPricePer1MUsd: 1.6,
    },
    requireActiveSubscription: activeAccess(),
    allowRequest: vi.fn().mockReturnValue(true),
    getMonthlyUsageKrw: vi.fn().mockResolvedValue(1_000),
    extractDocumentText: vi.fn().mockResolvedValue("3/4 자율 학교폭력 예방교육 1시간"),
    parseCreativeActivities: vi.fn().mockResolvedValue({
      activities: [
        {
          id: "activity-1",
          selected: true,
          date: "3/4",
          category: "자율",
          activity: "학교폭력 예방교육",
          hours: 1,
          needsReview: false,
          comment: "",
        },
      ],
      warnings: [],
      usage: { inputTokens: 100, outputTokens: 50 },
    }),
    calculateCostKrw: vi.fn().mockReturnValue(2),
    saveUsageEvent: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function baseRuntimeDependencies(overrides: Record<string, unknown> = {}) {
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
      teacherAccessPassword: "teacher-password",
      databaseUrl: "file:test.db",
    }),
    createResponseCreator: vi.fn().mockReturnValue({ create: vi.fn() }),
    allowRequest: vi.fn().mockReturnValue(true),
    getMonthlyUsageKrw: vi.fn().mockResolvedValue(0),
    extractDocumentTextFromBytes: vi.fn().mockResolvedValue("3/4 자율 안전교육"),
    parseCreativeActivitiesWithOpenAi: vi.fn(),
    calculateCostKrw: vi.fn().mockReturnValue(1),
    saveUsageEvent: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

async function parse(form = validForm(), overrides: Record<string, unknown> = {}) {
  const dependencies = baseDependencies(overrides);
  const response = await handleParseCreativeActivities(requestFrom(form), dependencies);
  return { response, body: await response.json(), dependencies };
}

describe("POST /api/creative-activities/parse", () => {
  it.each([
    ["인증 거절", vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      code: "SUBSCRIPTION_REQUIRED",
      message: "승인 후 이용할 수 있습니다.",
    })],
    ["인증 확인 예외", vi.fn().mockRejectedValue(new Error(`${PRIVATE_SOURCE} ${PRIVATE_FILE_NAME}`))],
  ])("런타임 %s는 서버 설정과 OpenAI 클라이언트보다 먼저 처리한다", async (_name, auth) => {
    const dependencies = baseRuntimeDependencies({ requireActiveSubscription: auth });

    const response = await handleParseCreativeActivitiesPost(
      requestFrom(validForm()),
      dependencies,
    );
    const body = await response.json();

    if (_name === "인증 거절") {
      expect(response.status).toBe(403);
      expect(body).toMatchObject({ code: "SUBSCRIPTION_REQUIRED" });
    } else {
      expect(response.status).toBe(503);
      expect(body).toMatchObject({ code: "AUTH_UNAVAILABLE" });
      expect(JSON.stringify(body)).not.toMatch(new RegExp(`${PRIVATE_SOURCE}|${PRIVATE_FILE_NAME}`));
    }
    expect(dependencies.readServerConfig).not.toHaveBeenCalled();
    expect(dependencies.createResponseCreator).not.toHaveBeenCalled();
    expect(dependencies.getMonthlyUsageKrw).not.toHaveBeenCalled();
    expect(dependencies.extractDocumentTextFromBytes).not.toHaveBeenCalled();
    expect(dependencies.parseCreativeActivitiesWithOpenAi).not.toHaveBeenCalled();
  });

  it("런타임은 설정을 인증 뒤에 읽되 틀린 비밀번호에서는 OpenAI 클라이언트를 만들지 않는다", async () => {
    const form = validForm();
    const wrong = new TestFormData();
    wrong.append("password", "wrong-password");
    wrong.append("file", form.get("file") as NodeFile);
    const dependencies = baseRuntimeDependencies();

    const response = await handleParseCreativeActivitiesPost(requestFrom(wrong), dependencies);

    expect(response.status).toBe(401);
    expect(dependencies.requireActiveSubscription).toHaveBeenCalledTimes(1);
    expect(dependencies.readServerConfig).toHaveBeenCalledTimes(1);
    expect(dependencies.requireActiveSubscription.mock.invocationCallOrder[0]).toBeLessThan(
      dependencies.readServerConfig.mock.invocationCallOrder[0],
    );
    expect(dependencies.createResponseCreator).not.toHaveBeenCalled();
    expect(dependencies.getMonthlyUsageKrw).not.toHaveBeenCalled();
    expect(dependencies.extractDocumentTextFromBytes).not.toHaveBeenCalled();
    expect(dependencies.parseCreativeActivitiesWithOpenAi).not.toHaveBeenCalled();
  });

  it.each([
    ["속도 제한", { allowRequest: vi.fn().mockReturnValue(false) }, 429],
    ["월 예산 제한", { getMonthlyUsageKrw: vi.fn().mockResolvedValue(30_000) }, 429],
    ["문서 추출 실패", {
      extractDocumentTextFromBytes: vi.fn().mockRejectedValue(new Error(PRIVATE_SOURCE)),
    }, 422],
  ])("런타임 %s 게이트 전에는 OpenAI 클라이언트를 만들지 않는다", async (_name, overrides, status) => {
    const dependencies = baseRuntimeDependencies(overrides);

    const response = await handleParseCreativeActivitiesPost(
      requestFrom(validForm()),
      dependencies,
    );

    expect(response.status).toBe(status);
    expect(dependencies.createResponseCreator).not.toHaveBeenCalled();
    expect(dependencies.parseCreativeActivitiesWithOpenAi).not.toHaveBeenCalled();
  });

  it("런타임은 파일 바이트와 이름을 추출한 뒤에야 OpenAI 클라이언트를 만든다", async () => {
    const dependencies = baseRuntimeDependencies({
      parseCreativeActivitiesWithOpenAi: vi.fn().mockResolvedValue({
        activities: [
          {
            id: "activity-1",
            selected: true,
            date: "3/4",
            category: "자율",
            activity: "안전교육",
            hours: 1,
            needsReview: false,
            comment: "",
          },
        ],
        warnings: [],
        usage: { inputTokens: 100, outputTokens: 50 },
      }),
    });

    const response = await handleParseCreativeActivitiesPost(
      requestFrom(validForm("시간표.HwPx", "file-bytes")),
      dependencies,
    );

    expect(response.status).toBe(200);
    expect(dependencies.extractDocumentTextFromBytes).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      "시간표.HwPx",
    );
    expect(dependencies.extractDocumentTextFromBytes.mock.invocationCallOrder[0]).toBeLessThan(
      dependencies.createResponseCreator.mock.invocationCallOrder[0],
    );
    expect(dependencies.createResponseCreator).toHaveBeenCalledWith("test-api-key");
    expect(dependencies.parseCreativeActivitiesWithOpenAi).toHaveBeenCalledWith(
      "3/4 자율 안전교육",
      expect.objectContaining({ create: expect.any(Function) }),
      "gpt-5.6-terra",
    );
  });

  it("파일을 추출기에 전달하고 개인정보를 제거한 60,000자 이하 텍스트만 분석한다", async () => {
    const tail = "자".repeat(60_100);
    const source = [
      "학교명: 서울초등학교",
      "담임 김교사",
      "교사명: 김민수",
      "teacher@example.com",
      "전화 010-1234-5678",
      "5학년 2반",
      `3/4 자율 학교폭력 예방교육 ${tail}`,
    ].join("\n");
    const form = validForm(PRIVATE_FILE_NAME);
    const extractDocumentText = vi.fn().mockResolvedValue(source);
    const dependencies = baseDependencies({ extractDocumentText });

    const response = await handleParseCreativeActivities(requestFrom(form), dependencies);
    const body = await response.json();

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(extractDocumentText).toHaveBeenCalledWith(form.get("file"));
    const parsedText = dependencies.parseCreativeActivities.mock.calls[0][0] as string;
    expect(parsedText).toHaveLength(60_000);
    expect(parsedText).toContain("3/4 자율 학교폭력 예방교육");
    expect(parsedText).not.toMatch(/서울초등학교|김교사|김민수|teacher@example\.com|010-1234-5678|5학년 2반/);
    expect(dependencies.parseCreativeActivities).toHaveBeenCalledWith(parsedText, "gpt-5.6-terra");
    expect(dependencies.calculateCostKrw).toHaveBeenCalledWith(
      { inputTokens: 100, outputTokens: 50 },
      { inputPricePer1MUsd: 0.4, outputPricePer1MUsd: 1.6, usdKrwRate: 1_400 },
    );
    expect(dependencies.saveUsageEvent).toHaveBeenCalledWith({
      inputTokens: 100,
      outputTokens: 50,
      costKrw: 2,
      model: "gpt-5.6-terra",
    });
    expect(body).toEqual({
      activities: expect.any(Array),
      warnings: [],
      usage: { amountKrw: 1_002, budgetKrw: 30_000 },
    });
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(source);
    expect(serialized).not.toContain(PRIVATE_FILE_NAME);
    expect(serialized).not.toContain("서울초등학교");
    expect(serialized).not.toContain("김교사");
  });

  it("선택한 학기 구간만 구조화 분석기에 전달한다", async () => {
    const source = [
      "2026학년도 1학기",
      "3.4(수) 학교폭력예방교육",
      "2026학년도 2학기",
      "9.4(금) 생명존중교육",
    ].join("\n");
    const form = validForm();
    form.append("semester", "2");
    const parseCreativeActivities = vi.fn().mockResolvedValue({
      activities: [{
        id: "activity-2",
        selected: true,
        date: "9/4",
        category: "자율",
        activity: "생명존중교육",
        hours: 1,
        needsReview: false,
        comment: "",
      }],
      warnings: [],
      usage: { inputTokens: 50, outputTokens: 20 },
    });

    const { response } = await parse(form, {
      extractDocumentText: vi.fn().mockResolvedValue(source),
      parseCreativeActivities,
    });

    expect(response.status).toBe(200);
    const analyzedText = parseCreativeActivities.mock.calls[0][0] as string;
    expect(analyzedText).toContain("2학기");
    expect(analyzedText).toContain("생명존중교육");
    expect(analyzedText).not.toContain("1학기");
    expect(analyzedText).not.toContain("학교폭력예방교육");
  });

  it("표준 연간시간표는 외부 모델 호출 없이 로컬에서 빠르게 분석한다", async () => {
    const source = [
      "교육과정 연간시간운영계획",
      "2026학년도 1학기",
      "1",
      "3. 2- 3. 6",
      "5",
      "국", "국", "수", "수", "과", "과",
      "자", "국", "수", "사", "과", "미",
      "국", "수", "사", "과", "영", "체",
      "국", "수", "사", "과", "영", "체",
      "자", "국", "수", "사", "미",
      "3.3(화) 학교폭력예방교육",
      "3.6(금) 학급자치회선출",
    ].join("\n");
    const parseCreativeActivities = vi.fn();
    const { response, body, dependencies } = await parse(validForm(), {
      extractDocumentText: vi.fn().mockResolvedValue(source),
      parseCreativeActivities,
    });

    expect(response.status).toBe(200);
    expect(parseCreativeActivities).not.toHaveBeenCalled();
    expect(dependencies.calculateCostKrw).not.toHaveBeenCalled();
    expect(dependencies.saveUsageEvent).not.toHaveBeenCalled();
    expect(body.activities).toEqual([
      expect.objectContaining({
        date: "3/3",
        category: "자율",
        activity: "학교폭력예방교육",
        comment: "",
      }),
      expect.objectContaining({
        date: "3/6",
        category: "자율",
        activity: "학급자치회선출",
        comment: "",
      }),
    ]);
    expect(body.warnings).toEqual([
      "표준 시간표 형식을 로컬에서 분석했습니다. 활동과 구분을 확인해 주세요.",
    ]);
    expect(body.usage).toEqual({ amountKrw: 1_000, budgetKrw: 30_000 });
  });

  it("분석기가 제거된 학교·학급·교사 정보를 되돌려도 응답에서 다시 제거한다", async () => {
    const source = [
      "학교명: 서울초등학교",
      "담임: 김민수",
      "teacher@example.com",
      "+82-10-1234-5678",
      "5학년 2반",
      "3/4 자율 안전교육",
    ].join("\n");
    const parseCreativeActivities = vi.fn().mockResolvedValue({
      activities: [
        {
          id: "activity-1",
          selected: true,
          date: "김민수 교사",
          category: "자율",
          activity: "학교명: 서울초등학교 김민수 교사 +82-10-1234-5678 5학년 2반 안전교육",
          hours: 1,
          needsReview: false,
          comment: "",
          rawText: PRIVATE_SOURCE,
          prompt: PRIVATE_PROMPT,
        },
      ],
      warnings: ["teacher@example.com 또는 +82-10-1234-5678로 확인"],
      usage: { inputTokens: 100, outputTokens: 50 },
    });

    const { response, body } = await parse(validForm(), {
      extractDocumentText: vi.fn().mockResolvedValue(source),
      parseCreativeActivities,
    });

    expect(response.status).toBe(200);
    const parsedText = parseCreativeActivities.mock.calls[0][0] as string;
    expect(parsedText).not.toContain("+82-10-1234-5678");
    expect(body.activities[0]).toMatchObject({ date: "확인 필요", needsReview: true });
    expect(JSON.stringify(body)).not.toMatch(
      new RegExp(
        `학교명|서울초등학교|김민수|teacher@example\\.com|\\+82-10-1234-5678|5학년 2반|${PRIVATE_SOURCE}|${PRIVATE_PROMPT}`,
      ),
    );
  });

  it.each([
    ["로그인하지 않은 사용자", 401, "AUTH_REQUIRED"],
    ["비활성 사용자", 403, "SUBSCRIPTION_REQUIRED"],
  ])("%s는 본문을 읽기 전에 %i를 반환한다", async (_name, status, code) => {
    const formData = vi.fn();
    const extractDocumentText = vi.fn();
    const dependencies = baseDependencies({
      requireActiveSubscription: vi.fn().mockResolvedValue({
        ok: false,
        status,
        code,
        message: "접근할 수 없습니다.",
      }),
      extractDocumentText,
    });
    const response = await handleParseCreativeActivities(
      requestFrom(validForm(), { formData }),
      dependencies,
    );

    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code });
    expect(formData).not.toHaveBeenCalled();
    expect(extractDocumentText).not.toHaveBeenCalled();
    expect(dependencies.allowRequest).not.toHaveBeenCalled();
    expect(dependencies.getMonthlyUsageKrw).not.toHaveBeenCalled();
    expect(dependencies.parseCreativeActivities).not.toHaveBeenCalled();
    expect(dependencies.calculateCostKrw).not.toHaveBeenCalled();
    expect(dependencies.saveUsageEvent).not.toHaveBeenCalled();
  });

  it("구독 확인 예외를 원인 정보 없는 503으로 바꾸고 본문과 후속 의존성을 호출하지 않는다", async () => {
    const formData = vi.fn();
    const dependencies = baseDependencies({
      requireActiveSubscription: vi.fn().mockRejectedValue(
        new Error(`${PRIVATE_SOURCE} ${PRIVATE_FILE_NAME}`),
      ),
    });

    const response = await handleParseCreativeActivities(
      requestFrom(validForm(), { formData }),
      dependencies,
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ code: "AUTH_UNAVAILABLE" });
    expect(JSON.stringify(body)).not.toMatch(new RegExp(`${PRIVATE_SOURCE}|${PRIVATE_FILE_NAME}`));
    expect(formData).not.toHaveBeenCalled();
    expect(dependencies.allowRequest).not.toHaveBeenCalled();
    expect(dependencies.getMonthlyUsageKrw).not.toHaveBeenCalled();
    expect(dependencies.extractDocumentText).not.toHaveBeenCalled();
    expect(dependencies.parseCreativeActivities).not.toHaveBeenCalled();
    expect(dependencies.calculateCostKrw).not.toHaveBeenCalled();
    expect(dependencies.saveUsageEvent).not.toHaveBeenCalled();
  });

  it("11MB를 넘는 요청은 multipart를 읽기 전에 거절한다", async () => {
    const formData = vi.fn();
    const response = await handleParseCreativeActivities(
      requestFrom(validForm(), {
        headers: { "content-length": String(ELEVEN_MB + 1) },
        formData,
      }),
      baseDependencies(),
    );

    expect(response.status).toBe(413);
    expect(formData).not.toHaveBeenCalled();
  });

  it.each([
    ["파일 누락", (() => {
      const form = new TestFormData();
      form.append("password", "teacher-password");
      return form;
    })()],
    ["파일 두 개", (() => {
      const form = validForm();
      form.append("file", new NodeFile(["second"], "두번째.pdf"));
      return form;
    })()],
    ["파일 대신 문자열", (() => {
      const form = new TestFormData();
      form.append("password", "teacher-password");
      form.append("file", "not-a-file");
      return form;
    })()],
    ["빈 비밀번호", (() => {
      const form = validForm();
      const replacement = new TestFormData();
      replacement.append("password", "");
      replacement.append("file", form.get("file") as NodeFile);
      return replacement;
    })()],
    ["201자 비밀번호", (() => {
      const form = validForm();
      const replacement = new TestFormData();
      replacement.append("password", "p".repeat(201));
      replacement.append("file", form.get("file") as NodeFile);
      return replacement;
    })()],
  ])("잘못된 multipart 입력(%s)을 400으로 거절한다", async (_name, form) => {
    const { response, dependencies } = await parse(form);

    expect(response.status).toBe(400);
    expect(dependencies.extractDocumentText).not.toHaveBeenCalled();
  });

  it("허용되지 않은 키의 추가 파일을 추출 전에 400으로 거절한다", async () => {
    const form = validForm();
    form.append("otherFile", new NodeFile(["hidden"], "우회.pdf"));

    const { response, dependencies } = await parse(form);

    expect(response.status).toBe(400);
    expect(dependencies.extractDocumentText).not.toHaveBeenCalled();
    expect(dependencies.parseCreativeActivities).not.toHaveBeenCalled();
  });

  it("multipart 파싱 실패를 일반 400 오류로 바꾼다", async () => {
    const response = await handleParseCreativeActivities(
      requestFrom(validForm(), {
        formData: vi.fn().mockRejectedValue(new Error(`${PRIVATE_SOURCE} ${PRIVATE_FILE_NAME}`)),
      }),
      baseDependencies(),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(JSON.stringify(body)).not.toMatch(new RegExp(`${PRIVATE_SOURCE}|${PRIVATE_FILE_NAME}`));
  });

  it("틀린 비밀번호는 사용량 조회와 추출보다 먼저 401로 거절한다", async () => {
    const form = validForm();
    const wrong = new TestFormData();
    wrong.append("password", "wrong-password");
    wrong.append("file", form.get("file") as NodeFile);
    const { response, dependencies } = await parse(wrong);

    expect(response.status).toBe(401);
    expect(dependencies.allowRequest).not.toHaveBeenCalled();
    expect(dependencies.getMonthlyUsageKrw).not.toHaveBeenCalled();
    expect(dependencies.extractDocumentText).not.toHaveBeenCalled();
  });

  it("전달된 첫 IP를 사용해 속도 제한을 적용한다", async () => {
    const dependencies = baseDependencies({ allowRequest: vi.fn().mockReturnValue(false) });
    const response = await handleParseCreativeActivities(
      requestFrom(validForm(), { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } }),
      dependencies,
    );

    expect(response.status).toBe(429);
    expect(dependencies.allowRequest).toHaveBeenCalledWith("203.0.113.7");
    expect(dependencies.getMonthlyUsageKrw).not.toHaveBeenCalled();
    expect(dependencies.extractDocumentText).not.toHaveBeenCalled();
  });

  it("사용량 조회 실패를 일반 503 오류로 바꾼다", async () => {
    const { response, body, dependencies } = await parse(validForm(PRIVATE_FILE_NAME), {
      getMonthlyUsageKrw: vi.fn().mockRejectedValue(new Error(PRIVATE_SOURCE)),
    });

    expect(response.status).toBe(503);
    expect(dependencies.extractDocumentText).not.toHaveBeenCalled();
    expect(JSON.stringify(body)).not.toMatch(new RegExp(`${PRIVATE_SOURCE}|${PRIVATE_FILE_NAME}`));
  });

  it("월 예산에 도달하면 추출과 OpenAI 호출 전에 429를 반환한다", async () => {
    const { response, dependencies } = await parse(validForm(), {
      getMonthlyUsageKrw: vi.fn().mockResolvedValue(30_000),
    });

    expect(response.status).toBe(429);
    expect(dependencies.extractDocumentText).not.toHaveBeenCalled();
    expect(dependencies.parseCreativeActivities).not.toHaveBeenCalled();
  });

  it.each(["시간표.docx", "시간표", "시간표.pdf.exe"])("지원하지 않는 확장자 %s를 거절한다", async (fileName) => {
    const { response, dependencies } = await parse(validForm(fileName));

    expect(response.status).toBe(400);
    expect(dependencies.extractDocumentText).not.toHaveBeenCalled();
  });

  it("빈 파일을 400으로 거절한다", async () => {
    const { response, dependencies } = await parse(validForm("시간표.hwp", ""));

    expect(response.status).toBe(400);
    expect(dependencies.extractDocumentText).not.toHaveBeenCalled();
  });

  it("10MB를 넘는 파일을 413으로 거절한다", async () => {
    const oversized = new Uint8Array(TEN_MB + 1);
    const { response, dependencies } = await parse(validForm("시간표.pdf", oversized));

    expect(response.status).toBe(413);
    expect(dependencies.extractDocumentText).not.toHaveBeenCalled();
  });

  it.each(["시간표.HWP", "시간표.HwPx", "시간표.PdF"])("대소문자와 무관하게 %s를 허용한다", async (fileName) => {
    const { response } = await parse(validForm(fileName));
    expect(response.status).toBe(200);
  });

  it.each([
    ["추출 예외", vi.fn().mockRejectedValue(new Error(`${PRIVATE_SOURCE} ${PRIVATE_FILE_NAME}`))],
    ["빈 추출 결과", vi.fn().mockResolvedValue("  \n\t  ")],
  ])("%s를 민감정보 없는 422로 바꾼다", async (_name, extractDocumentText) => {
    const { response, body, dependencies } = await parse(validForm(PRIVATE_FILE_NAME), {
      extractDocumentText,
    });

    expect(response.status).toBe(422);
    expect(dependencies.parseCreativeActivities).not.toHaveBeenCalled();
    expect(JSON.stringify(body)).not.toMatch(new RegExp(`${PRIVATE_SOURCE}|${PRIVATE_FILE_NAME}`));
  });

  it("OpenAI 분석 예외를 원인 정보 없는 502로 바꾼다", async () => {
    const { response, body } = await parse(validForm(PRIVATE_FILE_NAME), {
      extractDocumentText: vi.fn().mockResolvedValue(PRIVATE_SOURCE),
      parseCreativeActivities: vi.fn().mockRejectedValue(
        new Error(`${PRIVATE_MODEL_ERROR}: ${PRIVATE_SOURCE} ${PRIVATE_PROMPT}`),
      ),
    });

    expect(response.status).toBe(502);
    expect(JSON.stringify(body)).not.toMatch(
      new RegExp(`${PRIVATE_MODEL_ERROR}|${PRIVATE_SOURCE}|${PRIVATE_PROMPT}|${PRIVATE_FILE_NAME}`),
    );
  });

  it("대상 창체 행이 없으면 안내 문구와 함께 422를 반환한다", async () => {
    const { response, body, dependencies } = await parse(validForm(), {
      parseCreativeActivities: vi.fn().mockResolvedValue({
        activities: [],
        warnings: [],
        usage: { inputTokens: 100, outputTokens: 50 },
      }),
    });

    expect(response.status).toBe(422);
    expect(body.message).toBe("창체, 자율, 봉사, 진로 또는 자, 봉, 진 표기를 찾지 못했습니다.");
    expect(dependencies.calculateCostKrw).not.toHaveBeenCalled();
    expect(dependencies.saveUsageEvent).not.toHaveBeenCalled();
  });

  it("사용량 저장 실패는 활동을 반환하지 않는 일반 503 오류가 된다", async () => {
    const { response, body, dependencies } = await parse(validForm(PRIVATE_FILE_NAME), {
      extractDocumentText: vi.fn().mockResolvedValue(PRIVATE_SOURCE),
      saveUsageEvent: vi.fn().mockRejectedValue(new Error(`${PRIVATE_SOURCE} ${PRIVATE_FILE_NAME}`)),
    });

    expect(response.status).toBe(503);
    expect(body).not.toHaveProperty("activities");
    expect(JSON.stringify(body)).not.toMatch(new RegExp(`${PRIVATE_SOURCE}|${PRIVATE_FILE_NAME}`));
    expect(dependencies.saveUsageEvent).toHaveBeenCalledWith({
      inputTokens: 100,
      outputTokens: 50,
      costKrw: 2,
      model: "gpt-5.6-terra",
    });
  });
});
