import { describe, expect, it } from "vitest";

import { selectBalancedAreas } from "@/lib/area-selection";

const allExcellent = (studentNumber: number) => ({
  studentNumber,
  levels: ["문학", "읽기", "쓰기", "문법"].map((areaName) => ({ areaName, level: "매우 잘함" as const })),
});

describe("selectBalancedAreas", () => {
  it("매우 잘함, 잘함, 보통, 노력 요함 순으로 필요한 영역을 선택한다", () => {
    const [result] = selectBalancedAreas([{
      studentNumber: 1,
      levels: [
        { areaName: "문학", level: "보통" },
        { areaName: "읽기", level: "매우 잘함" },
        { areaName: "쓰기", level: "잘함" },
        { areaName: "문법", level: "노력 요함" },
      ],
    }], 2);

    expect(result.selected.map((item) => item.areaName)).toEqual(["읽기", "쓰기"]);
  });

  it("네 영역에서 세 영역을 요청하면 상위 단계 세 개만 정확히 선택한다", () => {
    const [result] = selectBalancedAreas([{
      studentNumber: 1,
      levels: [
        { areaName: "1영역", level: "매우 잘함" },
        { areaName: "2영역", level: "매우 잘함" },
        { areaName: "3영역", level: "잘함" },
        { areaName: "4영역", level: "노력 요함" },
      ],
    }], 3);

    expect(result.selected).toHaveLength(3);
    expect(result.selected.map(({ areaName }) => areaName)).toEqual(["1영역", "2영역", "3영역"]);
  });

  it("동일한 최상위 단계의 영역 조합을 반 전체에 분산한다", () => {
    const results = selectBalancedAreas([1, 2, 3, 4, 5, 6].map(allExcellent), 2);
    const combinations = new Set(results.map((result) => result.selected.map((item) => item.areaName).sort().join("+")));
    const counts = new Map<string, number>();
    for (const result of results) {
      for (const item of result.selected) counts.set(item.areaName, (counts.get(item.areaName) ?? 0) + 1);
    }

    expect(combinations.size).toBeGreaterThan(1);
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
  });

  it("균형을 위해 더 낮은 단계의 영역을 선택하지 않는다", () => {
    const results = selectBalancedAreas([
      ...[1, 2, 3].map(allExcellent),
      {
        studentNumber: 4,
        levels: [
          { areaName: "문학", level: "매우 잘함" as const },
          { areaName: "읽기", level: "매우 잘함" as const },
          { areaName: "쓰기", level: "잘함" as const },
          { areaName: "문법", level: "잘함" as const },
        ],
      },
    ], 2);

    expect(results.at(-1)?.selected.every((item) => item.level === "매우 잘함")).toBe(true);
  });

  it("같은 입력에는 항상 같은 결과를 반환한다", () => {
    const input = [1, 2, 3].map(allExcellent);
    expect(selectBalancedAreas(input, 3)).toEqual(selectBalancedAreas(input, 3));
  });

  it("요청한 영역 수가 학생의 평가 영역보다 크면 오류를 낸다", () => {
    expect(() => selectBalancedAreas([allExcellent(1)], 5)).toThrow("반영 영역 수");
  });

  it("확인된 단계가 부족하면 확인 필요 영역까지 포함해 요청한 개수를 채운다", () => {
    const [result] = selectBalancedAreas([{
      studentNumber: 1,
      levels: [
        { areaName: "법", level: "" },
        { areaName: "인문환경과 인간생활", level: "매우 잘함" },
        { areaName: "자연환경과 인간생활", level: "잘함" },
        { areaName: "지리 인식", level: "" },
      ],
    }], 3);

    expect(result.selected.map((item) => item.areaName)).toHaveLength(3);
    expect(result.selected.map((item) => item.areaName)).toEqual([
      "인문환경과 인간생활",
      "자연환경과 인간생활",
      "법",
    ]);
  });

  it("상위 단계 우선순위를 지키면서 동점 영역은 전체 사용량이 골고루 분포되도록 고른다", () => {
    const results = selectBalancedAreas([
      {
        studentNumber: 1,
        levels: [
          { areaName: "1영역", level: "매우 잘함" },
          { areaName: "2영역", level: "매우 잘함" },
          { areaName: "3영역", level: "매우 잘함" },
          { areaName: "4영역", level: "잘함" },
        ],
      },
      {
        studentNumber: 2,
        levels: [
          { areaName: "1영역", level: "매우 잘함" },
          { areaName: "2영역", level: "매우 잘함" },
          { areaName: "3영역", level: "매우 잘함" },
          { areaName: "4영역", level: "잘함" },
        ],
      },
      {
        studentNumber: 3,
        levels: [
          { areaName: "1영역", level: "매우 잘함" },
          { areaName: "2영역", level: "매우 잘함" },
          { areaName: "3영역", level: "매우 잘함" },
          { areaName: "4영역", level: "잘함" },
        ],
      },
    ], 3);

    expect(results.every((result) => result.selected.every((item) => item.level === "매우 잘함"))).toBe(true);
    expect(new Set(results.map((result) => result.selected.map((item) => item.areaName).join(","))).size).toBeGreaterThan(1);
  });
});
