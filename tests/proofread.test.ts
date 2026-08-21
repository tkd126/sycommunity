import { describe, expect, it, vi } from "vitest";

import { proofreadComments, proofreadRequestSchema } from "@/lib/proofread";

const input = {
  password: "teacher-password",
  rows: [
    { id: "row-1", comment: "학교 생활에 적극적으로 참여 함." },
    { id: "row-2", comment: "활동을 정확하게 이해하고 정확하게 설명함." },
  ],
};

describe("proofreadComments", () => {
  it("accepts only an opaque id and comment for each row", () => {
    expect(proofreadRequestSchema.safeParse(input).success).toBe(true);
    expect(proofreadRequestSchema.safeParse({
      ...input,
      rows: [{ ...input.rows[0], studentName: "김하늘" }],
    }).success).toBe(false);
    expect(proofreadRequestSchema.safeParse({
      ...input,
      rows: [{ ...input.rows[0], studentNumber: 1 }],
    }).success).toBe(false);
    expect(proofreadRequestSchema.safeParse({
      ...input,
      rows: [{ ...input.rows[0], activity: "민감한 활동 원문" }],
    }).success).toBe(false);
  });

  it("requests grammar-only corrections and returns matching ids", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({ rows: [
        { id: "row-1", comment: "학교생활에 적극적으로 참여함." },
        { id: "row-2", comment: "활동을 정확하게 이해하고 구체적으로 설명함." },
      ] }),
      usage: { input_tokens: 120, output_tokens: 60 },
    });

    const result = await proofreadComments(input, { create });

    const prompt = create.mock.calls[0][0].input[0].content as string;
    expect(prompt).toContain("맞춤법");
    expect(prompt).toContain("사실이나 평가 수준을 추가하거나 삭제하지 않는다");
    expect(prompt).toContain("명사형 종결");
    expect(result.rows).toEqual([
      { id: "row-1", comment: "학교생활에 적극적으로 참여함." },
      { id: "row-2", comment: "활동을 정확하게 이해하고 구체적으로 설명함." },
    ]);
    expect(result.usage).toEqual({ inputTokens: 120, outputTokens: 60 });
  });

  it("rejects missing, duplicate, or unknown response ids", async () => {
    const response = (rows: Array<{ id: string; comment: string }>) => ({
      output_text: JSON.stringify({ rows }),
      usage: { input_tokens: 10, output_tokens: 10 },
    });

    await expect(proofreadComments(input, { create: vi.fn().mockResolvedValue(response([
      { id: "row-1", comment: "교정함." },
    ])) })).rejects.toThrow("교정 결과 행이 요청과 일치하지 않습니다");
    await expect(proofreadComments(input, { create: vi.fn().mockResolvedValue(response([
      { id: "row-1", comment: "교정함." },
      { id: "row-1", comment: "다시 교정함." },
    ])) })).rejects.toThrow("교정 결과 행이 요청과 일치하지 않습니다");
    await expect(proofreadComments(input, { create: vi.fn().mockResolvedValue(response([
      { id: "row-1", comment: "교정함." },
      { id: "unknown", comment: "알 수 없음." },
    ])) })).rejects.toThrow("교정 결과 행이 요청과 일치하지 않습니다");
  });
});
