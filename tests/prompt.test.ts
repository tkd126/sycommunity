import { describe, expect, it } from "vitest";

import { buildReportPrompt } from "@/lib/prompt";

const baseInput = {
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
  evaluationPlan: "작품 속 인물의 마음을 파악한다.",
  worksheets: "인물의 말과 행동을 근거로 생각을 표현한다.",
  example: "근거를 들어 자신의 생각을 자연스럽게 표현함.",
  instruction: "긍정적인 문장으로 작성한다.",
};

describe("buildReportPrompt", () => {
  it("학생 이름 없이 번호와 단계만 포함한다", () => {
    const prompt = buildReportPrompt(baseInput);

    expect(prompt).toContain("학생 번호 1");
    expect(prompt).toContain("문학: 매우 잘함");
    expect(prompt).not.toContain("name");
    expect(prompt).not.toContain("성명");
  });

  it("과목별 추출 영역 수와 JSON 응답 규칙을 명시한다", () => {
    const prompt = buildReportPrompt(baseInput);

    expect(prompt).toContain("3개 영역");
    expect(prompt).toContain("마크다운을 사용하지 않는다");
    expect(prompt).toContain('"studentNumber"');
    expect(prompt).toContain("이미 선택된 최종 근거");
  });

  it("선택 영역마다 입력 순서대로 정확히 한 문장을 요구한다", () => {
    const prompt = buildReportPrompt(baseInput);

    expect(prompt).toContain("선택 영역 하나당 정확히 한 문장");
    expect(prompt).toContain("입력에 제시된 영역 순서");
    expect(prompt).toContain("areaComments");
    expect(prompt).toContain("여러 영역의 내용을 한 문장으로 합치지 않는다");
  });

  it("영역별 평어를 더 길고 구체적인 자연스러운 문장으로 요구한다", () => {
    const prompt = buildReportPrompt(baseInput);

    expect(prompt).toContain("55자에서 100자");
    expect(prompt).toContain("구체적인 학습 대상 또는 개념");
    expect(prompt).toContain("활동이나 사고 과정");
    expect(prompt).toContain("기본적인 이해를 보임");
    expect(prompt).toContain("잘 설명함");
    expect(prompt).toContain("기본 개념의 의미와 적용 방법을 이해함");
    expect(prompt).toContain("공통점과 차이점을 명확하게 설명함");
  });
  it("허용하지 않은 학생 이름 필드를 거부한다", () => {
    expect(() =>
      buildReportPrompt({
        ...baseInput,
        students: [{ ...baseInput.students[0], name: "김하늘" }],
      } as unknown as typeof baseInput),
    ).toThrow();
  });

  it("긴 참고 자료는 선택 과목 근거를 유지하면서 중복과 전체 길이를 줄인다", () => {
    const repeated = Array.from({ length: 1200 }, () => "공통 평가 안내").join("\n");
    const prompt = buildReportPrompt({
      ...baseInput,
      subject: "사회",
      evaluationPlan: `${repeated}\n사회 지리 영역의 성취기준과 평가 요소\n${repeated}`,
      worksheets: repeated,
    });

    expect(prompt).toContain("사회 지리 영역의 성취기준과 평가 요소");
    expect(prompt.length).toBeLessThan(20_000);
    expect(prompt.match(/공통 평가 안내/g)?.length).toBeLessThan(10);
  });
});
