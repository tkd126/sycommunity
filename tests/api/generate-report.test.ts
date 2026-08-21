import { describe, expect, it, vi } from "vitest";

import { handleGenerateReport } from "@/app/api/generate-report/handler";
import { generateReports, getReportOutputTokenLimit } from "@/lib/openai";

const validInput = {
  password: "teacher-password",
  subject: "국어",
  areaCount: 3,
  students: [
    {
      studentNumber: 1,
      levels: [
        { areaName: "문학", level: "매우 잘함" as const },
        { areaName: "읽기", level: "잘함" as const },
        { areaName: "쓰기", level: "보통" as const },
      ],
    },
  ],
  evaluationPlan: "인물의 마음을 파악한다.",
  worksheets: "말과 행동에서 근거를 찾는다.",
  example: "근거를 들어 자연스럽게 표현함.",
  instruction: "긍정적으로 작성한다.",
};

const fakeOpenAiResponse = {
  output_text: JSON.stringify({
    subject: "국어",
    warning: "",
    rows: [
      {
        studentNumber: 1,
        selectedLevels: "문학 매우 잘함",
        areaComments: [
          { areaName: "문학", comment: "학생은 작품을 잘하지 못함." },
          { areaName: "읽기", comment: "글의 내용을 정확하게 파악함." },
          { areaName: "쓰기", comment: "경험을 문장으로 표현함." },
        ],
      },
    ],
  }),
  usage: { input_tokens: 100, output_tokens: 50 },
};

const activeAccess = vi.fn().mockResolvedValue({
  ok: true,
  userId: "user-1",
  email: "teacher@example.com",
  role: "teacher",
} as const);

describe("generateReports", () => {
  it("OpenAI 요청에는 학생 번호만 보내고 결과를 정제한다", async () => {
    const create = vi.fn().mockResolvedValue(fakeOpenAiResponse);
    const result = await generateReports(validInput, { create });

    expect(JSON.stringify(create.mock.calls)).not.toContain("김하늘");
    const prompt = create.mock.calls[0][0].input[0].content;
    expect(prompt).not.toContain("name");
    expect(result.rows[0].comment).toBe(
      "작품을 해결 방법을 익혀 가고 있음. 글의 내용을 정확하게 파악함. 경험을 문장으로 표현함.",
    );
    expect(create.mock.calls[0][0].max_output_tokens).toBe(800);
  });

  it("영역별 평어 수가 선택 영역 수와 다르면 거부한다", async () => {
    const invalidResponse = {
      ...fakeOpenAiResponse,
      output_text: JSON.stringify({
        subject: "국어",
        warning: "",
        rows: [{
          studentNumber: 1,
          selectedLevels: "문학 매우 잘함 읽기 잘함 쓰기 보통",
          areaComments: [
            { areaName: "문학", comment: "작품의 내용을 파악함." },
            { areaName: "읽기", comment: "글을 정확하게 읽음." },
          ],
        }],
      }),
    };

    await expect(generateReports(validInput, { create: vi.fn().mockResolvedValue(invalidResponse) }))
      .rejects.toThrow("영역별 평어 수가 선택 영역 수와 일치하지 않습니다");
  });

  it("영역별 평어의 순서만 다르면 입력 영역 순서로 재정렬한다", async () => {
    const invalidResponse = {
      ...fakeOpenAiResponse,
      output_text: JSON.stringify({
        subject: "국어",
        warning: "",
        rows: [{
          studentNumber: 1,
          selectedLevels: "문학 매우 잘함 읽기 잘함 쓰기 보통",
          areaComments: [
            { areaName: "읽기", comment: "글을 정확하게 읽음." },
            { areaName: "문학", comment: "작품의 내용을 파악함." },
            { areaName: "쓰기", comment: "경험을 문장으로 표현함." },
          ],
        }],
      }),
    };

    const result = await generateReports(validInput, { create: vi.fn().mockResolvedValue(invalidResponse) });

    expect(result.rows[0].comment).toBe(
      "작품의 내용을 파악함. 글을 정확하게 읽음. 경험을 문장으로 표현함.",
    );
  });

  it("학생별 선택 영역 수가 반영 영역 수보다 적으면 OpenAI 호출 전에 거부한다", async () => {
    const create = vi.fn().mockResolvedValue(fakeOpenAiResponse);
    const invalidInput = {
      ...validInput,
      students: [{
        ...validInput.students[0],
        levels: validInput.students[0].levels.slice(0, 2),
      }],
    };

    await expect(generateReports(invalidInput, { create }))
      .rejects.toThrow("학생별 선택 영역 수가 평어 반영 영역 수와 일치해야 합니다");
    expect(create).not.toHaveBeenCalled();
  });

  it("영역별 평어 하나에 마침표가 여러 개면 한 문장으로 정규화한다", async () => {
    const invalidResponse = {
      ...fakeOpenAiResponse,
      output_text: fakeOpenAiResponse.output_text.replace(
        "학생은 작품을 잘하지 못함.",
        "작품의 내용을 파악함. 생각을 표현함.",
      ),
    };

    const result = await generateReports(validInput, { create: vi.fn().mockResolvedValue(invalidResponse) });
    expect(result.rows[0].comment).toContain("작품의 내용을 파악함, 생각을 표현함.");
  });

  it("학생 수와 영역 수에 맞춰 출력 토큰을 제한하되 서버 상한을 지킨다", () => {
    expect(getReportOutputTokenLimit(1, 3)).toBe(800);
    expect(getReportOutputTokenLimit(14, 3)).toBe(4700);
    expect(getReportOutputTokenLimit(27, 3)).toBe(5000);
  });

  it("영역명이 중복되거나 누락되면 거부한다", async () => {
    const invalidResponse = {
      ...fakeOpenAiResponse,
      output_text: JSON.stringify({
        subject: "국어",
        warning: "",
        rows: [{
          studentNumber: 1,
          selectedLevels: "문학 매우 잘함 읽기 잘함 쓰기 보통",
          areaComments: [
            { areaName: "문학", comment: "작품의 내용을 파악함." },
            { areaName: "문학", comment: "인물의 마음을 이해함." },
            { areaName: "쓰기", comment: "경험을 문장으로 표현함." },
          ],
        }],
      }),
    };

    await expect(generateReports(validInput, { create: vi.fn().mockResolvedValue(invalidResponse) }))
      .rejects.toThrow("영역별 평어가 선택 영역과 일치하지 않습니다");
  });

  it("요청 번호와 다른 응답 번호를 거부한다", async () => {
    const create = vi.fn().mockResolvedValue({
      ...fakeOpenAiResponse,
      output_text: fakeOpenAiResponse.output_text.replace('"studentNumber":1', '"studentNumber":2'),
    });

    await expect(generateReports(validInput, { create })).rejects.toThrow(
      "학생 번호가 요청과 일치하지 않습니다",
    );
  });
});

describe("handleGenerateReport", () => {
  it("진행 스트림 요청은 27명을 두 묶음으로 생성하고 실제 완료 인원을 보낸다", async () => {
    const students = Array.from({ length: 27 }, (_, index) => ({
      studentNumber: index + 1,
      levels: validInput.students[0].levels,
    }));
    const makeResponse = (numbers: number[]) => ({
      output_text: JSON.stringify({
        subject: "국어",
        warning: "",
        rows: numbers.map((studentNumber) => ({
          studentNumber,
          selectedLevels: "문학 매우 잘함 읽기 잘함 쓰기 보통",
          areaComments: [
            { areaName: "문학", comment: "작품의 내용을 파악함." },
            { areaName: "읽기", comment: "글을 정확하게 읽음." },
            { areaName: "쓰기", comment: "경험을 문장으로 표현함." },
          ],
        })),
      }),
      usage: { input_tokens: 100, output_tokens: 50 },
    });
    const create = vi.fn()
      .mockResolvedValueOnce(makeResponse(Array.from({ length: 14 }, (_, index) => index + 1)))
      .mockResolvedValueOnce(makeResponse(Array.from({ length: 13 }, (_, index) => index + 15)));
    const saveUsageEvent = vi.fn().mockResolvedValue(undefined);

    const response = await handleGenerateReport(
      new Request("http://localhost/api/generate-report", {
        method: "POST",
        headers: { accept: "application/x-ndjson" },
        body: JSON.stringify({ ...validInput, students }),
      }),
      {
        config: { teacherAccessPassword: "teacher-password", monthlyBudgetKrw: 30_000 },
        getMonthlyUsageKrw: vi.fn().mockResolvedValue(1_000),
        create,
        saveUsageEvent,
        allowRequest: () => true,
        requireActiveSubscription: activeAccess,
      },
    );

    const events = (await response.text()).trim().split("\n").map((line) => JSON.parse(line));
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    expect(create).toHaveBeenCalledTimes(2);
    expect(saveUsageEvent).toHaveBeenCalledTimes(2);
    expect(events.filter((event) => event.type === "progress").map((event) => event.completed).sort((a, b) => a - b))
      .toEqual([14, 27]);
    expect(events.at(-1)).toMatchObject({ type: "complete", completed: 27, failed: 0, total: 27 });
  });

  it("승인된 사용자가 아니면 OpenAI를 호출하지 않는다", async () => {
    const create = vi.fn();
    const response = await handleGenerateReport(
      new Request("http://localhost/api/generate-report", {
        method: "POST",
        body: JSON.stringify(validInput),
      }),
      {
        config: { teacherAccessPassword: "teacher-password", monthlyBudgetKrw: 30_000 },
        getMonthlyUsageKrw: vi.fn(),
        create,
        saveUsageEvent: vi.fn(),
        allowRequest: () => true,
        requireActiveSubscription: vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          code: "SUBSCRIPTION_REQUIRED",
          message: "관리자 승인 후 이용할 수 있습니다.",
        }),
      },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "SUBSCRIPTION_REQUIRED" });
    expect(create).not.toHaveBeenCalled();
  });

  it("비밀번호가 틀리면 OpenAI를 호출하지 않는다", async () => {
    const create = vi.fn();
    const response = await handleGenerateReport(
      new Request("http://localhost/api/generate-report", {
        method: "POST",
        body: JSON.stringify({ ...validInput, password: "wrong" }),
      }),
      {
        config: { teacherAccessPassword: "teacher-password", monthlyBudgetKrw: 30_000 },
        getMonthlyUsageKrw: vi.fn(),
        create,
        saveUsageEvent: vi.fn(),
        allowRequest: () => true,
        requireActiveSubscription: activeAccess,
      },
    );

    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("월 한도 이상이면 OpenAI를 호출하지 않는다", async () => {
    const create = vi.fn();
    const response = await handleGenerateReport(
      new Request("http://localhost/api/generate-report", {
        method: "POST",
        body: JSON.stringify(validInput),
      }),
      {
        config: { teacherAccessPassword: "teacher-password", monthlyBudgetKrw: 30_000 },
        getMonthlyUsageKrw: vi.fn().mockResolvedValue(30_000),
        create,
        saveUsageEvent: vi.fn(),
        allowRequest: () => true,
        requireActiveSubscription: activeAccess,
      },
    );

    expect(response.status).toBe(429);
    expect(create).not.toHaveBeenCalled();
  });
});
