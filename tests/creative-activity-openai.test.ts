import { describe, expect, it, vi } from "vitest";

import {
  generateCreativeComments,
  parseCreativeActivities,
  type CreativeCommentInput,
} from "@/lib/creative-activity-openai";

const usage = { input_tokens: 120, output_tokens: 40 };

const validRows: CreativeCommentInput[] = [
  {
    id: "activity-1",
    date: "3/4",
    category: "자율",
    activity: "다문화 교육",
    hours: 1,
  },
  {
    id: "activity-2",
    date: "3/4",
    category: "진로",
    activity: "나의 꿈 탐색",
    hours: 1,
  },
];

describe("parseCreativeActivities", () => {
  it("주별 시간표 칸과 오른쪽 비고를 연결하고 구분·개인정보 규칙을 지키도록 요청한다", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        activities: [
          {
            date: "3.4(수)",
            category: "자",
            activity: "학교폭력 예방 교육",
            hours: 1,
            needsReview: false,
          },
        ],
        warnings: [],
      }),
      usage,
    });

    await parseCreativeActivities(
      "1주 수 자 / 비고 3.4(수) 학교폭력 예방 교육",
      { create },
    );

    const params = create.mock.calls[0][0];
    const prompt = params.input[0].content as string;
    expect(params).toMatchObject({
      model: "gpt-5.6-terra",
      reasoning: { effort: "none" },
      temperature: 0.2,
      max_output_tokens: 3000,
      text: {
        format: {
          type: "json_schema",
          strict: true,
        },
      },
    });
    expect(prompt).toContain("주별 시간표 칸");
    expect(prompt).toContain("오른쪽 비고");
    expect(prompt).toContain("자=자율");
    expect(prompt).toContain("봉=봉사");
    expect(prompt).toContain("진=진로");
    expect(prompt).toMatch(/동.*동아리.*제외/);
    expect(prompt).toContain("needsReview");
    expect(prompt).toMatch(/학교명.*학급명.*교사명.*학생명/);
  });

  it("날짜와 활동이 같은 줄에 있으면 날짜를 확정 표기로 전처리하고 확인 필요 문구를 날짜 값으로 쓰지 않게 요청한다", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        activities: [
          {
            date: "2026. 3. 4.(수)",
            category: "자",
            activity: "학교폭력 예방 교육",
            hours: 1,
            needsReview: false,
          },
        ],
        warnings: [],
      }),
      usage,
    });

    const result = await parseCreativeActivities(
      "3.3(화) 시업식\n3.4(수) 학교폭력예방교육\n3.4(수) 개인위생교육",
      { create },
    );

    const prompt = create.mock.calls[0][0].input[0].content as string;
    expect(prompt).toContain("[확정 날짜 3/3] 시업식");
    expect(prompt).toContain("[확정 날짜 3/4] 학교폭력예방교육");
    expect(prompt).toMatch(/날짜.*확인 필요.*쓰지/u);
    expect(result.activities[0]).toMatchObject({ date: "3/4", needsReview: false });
  });

  it("동아리를 제외하고 같은 날짜의 자율과 진로를 별도 행으로 정규화한다", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        activities: [
          { date: "3/4", category: "자", activity: "학급 약속", hours: 1, needsReview: false },
          { date: "3/4", category: "동", activity: "독서 동아리", hours: 1, needsReview: false },
          { date: "3/4", category: "진", activity: "꿈 탐색", hours: 1, needsReview: true },
        ],
        warnings: ["일부 시수 확인 필요"],
      }),
      usage,
    });

    const result = await parseCreativeActivities("시간표 전체 텍스트", { create });

    expect(result.activities).toHaveLength(2);
    expect(result.activities.map(({ category }) => category)).toEqual(["자율", "진로"]);
    expect(result.activities.map(({ date }) => date)).toEqual(["3/4", "3/4"]);
    expect(result.activities[1].needsReview).toBe(true);
    expect(result.warnings).toEqual(["일부 시수 확인 필요"]);
    expect(result.usage).toEqual({ inputTokens: 120, outputTokens: 40 });
  });

  it.each([
    ["JSON이 아닌 응답", "not json", usage],
    ["스키마가 다른 응답", JSON.stringify({ activities: [], warnings: [], extra: true }), usage],
    ["토큰 사용량 누락", JSON.stringify({ activities: [], warnings: [] }), null],
    ["입력 토큰 0", JSON.stringify({ activities: [], warnings: [] }), { input_tokens: 0, output_tokens: 1 }],
  ])("%s을 안전하게 거부한다", async (_name, output_text, responseUsage) => {
    const source = "외부에 노출되면 안 되는 시간표 원문";
    const creator = { create: vi.fn().mockResolvedValue({ output_text, usage: responseUsage }) };

    let error: unknown;
    try {
      await parseCreativeActivities(source, creator);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain(source);
  });

  it.each(["", "   ", "가".repeat(60_001)])("빈 입력과 60,000자 초과 입력을 거부한다", async (text) => {
    const create = vi.fn();

    await expect(parseCreativeActivities(text, { create })).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it("OpenAI 요청 실패 오류에서 시간표 원문을 노출하지 않는다", async () => {
    const sensitiveSource = "민감한 학교 시간표 원문";
    const create = vi.fn().mockRejectedValue(
      new Error(`request failed: ${sensitiveSource}`),
    );

    let error: unknown;
    try {
      await parseCreativeActivities(sensitiveSource, { create });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("시간표 구조화 요청에 실패했습니다.");
    expect((error as Error).message).not.toContain(sensitiveSource);
  });
});

describe("generateCreativeComments", () => {
  it("id별 한국어 한 문장·명사형 종결과 사실 비창작 원칙으로 요청한다", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        rows: [
          { id: "activity-1", comment: "다문화 교육 활동에 적극적으로 참여하여 서로 다른 문화의 특징과 가치를 구체적으로 이해하고 다양성을 존중하며 함께 생활하는 공동체 태도를 길렀습니다." },
          { id: "activity-2", comment: "나의 꿈을 탐색하는 활동에 성실하게 참여하여 여러 직업의 역할과 특징을 비교하고 자신의 흥미와 관련된 진로 정보를 주도적으로 살펴보는 태도를 길렀습니다." },
        ],
      }),
      usage,
    });

    await generateCreativeComments(validRows, { create });

    const params = create.mock.calls[0][0];
    const prompt = params.input[0].content as string;
    expect(params).toMatchObject({
      model: "gpt-5.6-terra",
      reasoning: { effort: "none" },
      temperature: 0.2,
      max_output_tokens: 5000,
      text: {
        format: {
          type: "json_schema",
          strict: true,
        },
      },
    });
    expect(prompt).toMatch(/id.*한 문장/);
    expect(prompt).toContain("명사형 종결어미");
    expect(prompt).toMatch(/긍정.*자연/);
    expect(prompt).toMatch(/원문.*사실.*만들지/);
    expect(prompt).toMatch(/행사.*수상.*능력/);
    expect(prompt).toMatch(/제품명.*고유 명사.*일반/);
    expect(prompt).toContain("60자 이상 100자 이내");
    expect(prompt).toMatch(/활동.*과정.*구체적/);
    expect(prompt).toMatch(/무엇을.*기름/);
    expect(prompt).toMatch(/두 절.*한 문장/);
    expect(prompt).toMatch(/참여함.*익힘.*기름.*함양함/u);
    expect(prompt).toContain("과정임");
    expect(prompt).not.toContain("기름인지");
    expect(prompt).toContain("길렀는지");
expect(prompt).toContain("함을 보임");
    expect(prompt).toContain("실천함을 다짐함");
    expect(prompt).toContain("기름을 다짐함");
    expect(prompt).toContain("높임을 다짐함");
    expect(prompt).toContain("이해함을 익힘");
    expect(prompt).toContain("바로 문장을 끝내라");
    expect(prompt).toContain("국어 문법");
    expect(prompt).toContain("동일하거나 유사한 부사어");
    expect(prompt).toContain("자기 이해를 익힘");
    expect(prompt).toContain("활동임");
    expect(prompt).toContain("형성임");
    expect(
      params.text.format.schema.properties.rows.items.properties.comment.minLength,
    ).toBe(60);
  });

  it("같은 날짜의 두 id를 유지하고 모든 평어를 정제한다", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        rows: [
          { id: "activity-1", comment: "LEGO와 diversity를 활용한 표현 활동에 적극적으로 참여하여 서로 다른 재료의 특징을 이해하고 자신의 생각을 구체적으로 나타내는 표현 역량을 길렀습니다!" },
          { id: "activity-2", comment: "유튜브를 활용한 진로 탐색 활동에 적극적으로 참여하여 여러 직업의 특징을 비교하고 자신의 흥미와 관련된 진로 정보를 탐색하는 태도를 길렀습니다." },
        ],
      }),
      usage,
    });

    const result = await generateCreativeComments(validRows, { create });

    expect(result.rows).toEqual([
      { id: "activity-1", comment: "블록 모형과 다양성을 활용한 표현 활동에 적극적으로 참여하여 서로 다른 재료의 특징을 이해하고 자신의 생각을 구체적으로 나타내는 표현 역량을 기름." },
      { id: "activity-2", comment: "영상 자료를 활용한 진로 탐색 활동에 적극적으로 참여하여 여러 직업의 특징을 비교하고 자신의 흥미와 관련된 진로 정보를 탐색하는 태도를 기름." },
    ]);
    expect(result.usage).toEqual({ inputTokens: 120, outputTokens: 40 });
  });

  it("정제 후에도 문법 검사를 통과하지 못한 평어를 활동별 안전 문장으로 대체한다", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        rows: [
          { id: "activity-1", comment: `${"가".repeat(60)} 설명임.` },
          { id: "activity-2", comment: `${"나".repeat(60)} 설명임.` },
        ],
      }),
      usage,
    });

    const result = await generateCreativeComments(validRows, { create });

    expect(result.rows[0].comment).toContain("다문화 교육에 참여하여");
    expect(result.rows[0].comment).toMatch(/태도를 기름\.$/u);
    expect(result.rows[1].comment).toContain("나의 꿈 탐색에 참여하여");
    expect(result.rows[1].comment).toMatch(/진로 방향을 탐색함\.$/u);
    result.rows.forEach(({ comment }) => {
      expect(comment).not.toMatch(/(?:함을 보임|함함|설명임|[{}])/u);
    });
  });

  it.each([
    ["누락 id", [{ id: "activity-1", comment: "활동에 참여했습니다." }]],
    ["중복 id", [
      { id: "activity-1", comment: "활동에 참여했습니다." },
      { id: "activity-1", comment: "활동을 돌아봤습니다." },
    ]],
    ["알 수 없는 id", [
      { id: "activity-1", comment: "활동에 참여했습니다." },
      { id: "unknown", comment: "활동을 돌아봤습니다." },
    ]],
  ])("응답의 %s를 거부한다", async (_name, rows) => {
    const creator = {
      create: vi.fn().mockResolvedValue({
        output_text: JSON.stringify({ rows }),
        usage,
      }),
    };

    await expect(generateCreativeComments(validRows, creator)).rejects.toThrow();
  });

  it.each([
    ["빈 배열", []],
    ["51개 행", Array.from({ length: 51 }, (_, index) => ({ ...validRows[0], id: `id-${index}` }))],
    ["중복 입력 id", [validRows[0], { ...validRows[1], id: validRows[0].id }]],
    ["앞뒤 공백이 있는 id", [{ ...validRows[0], id: " activity-1 " }]],
    ["잘못된 날짜", [{ ...validRows[0], date: "2/30" }]],
    ["잘못된 구분", [{ ...validRows[0], category: "동아리" }]],
    ["잘못된 시수", [{ ...validRows[0], hours: 0 }]],
    ["너무 긴 활동", [{ ...validRows[0], activity: "가".repeat(201) }]],
  ])("%s 입력을 OpenAI 호출 전에 거부한다", async (_name, rows) => {
    const create = vi.fn();

    await expect(
      generateCreativeComments(rows as CreativeCommentInput[], { create }),
    ).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    [null],
    [{ input_tokens: 1, output_tokens: 0 }],
    [{ input_tokens: "1", output_tokens: 1 }],
    [{ input_tokens: Number.POSITIVE_INFINITY, output_tokens: 1 }],
  ])("양수가 아닌 토큰 사용량을 거부한다", async (responseUsage) => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        rows: validRows.map(({ id }) => ({ id, comment: "활동에 참여했습니다." })),
      }),
      usage: responseUsage,
    });

    await expect(generateCreativeComments(validRows, { create })).rejects.toThrow();
  });

  it("정제 후 빈 문자열이 되는 평어를 거부한다", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        rows: validRows.map(({ id }) => ({ id, comment: "ChatGPT" })),
      }),
      usage,
    });

    await expect(generateCreativeComments(validRows, { create })).rejects.toThrow();
  });

  it("OpenAI 요청 실패 오류에서 활동 원문과 id를 노출하지 않는다", async () => {
    const sensitiveSource = "민감한 학생 활동 원문";
    const sensitiveId = "private-activity-id";
    const rows = [{ ...validRows[0], id: sensitiveId, activity: sensitiveSource }];
    const create = vi.fn().mockRejectedValue(
      new Error(`request failed: ${sensitiveSource} ${sensitiveId}`),
    );

    let error: unknown;
    try {
      await generateCreativeComments(rows, { create });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("창체 평어 생성 요청에 실패했습니다.");
    expect((error as Error).message).not.toContain(sensitiveSource);
    expect((error as Error).message).not.toContain(sensitiveId);
  });
});
