import { describe, expect, it } from "vitest";

import {
  addEmptyRow,
  applyDummyComments,
  getTargetIds,
  removeSelectedRows,
  toClipboardText,
  toCsv,
} from "@/lib/report-ui";
import type { StudentRow } from "@/types/report";

const rows: StudentRow[] = [
  {
    id: "1",
    selected: false,
    number: 1,
    name: "김하늘",
    reference: "",
    evaluation: "1영역 매우 잘함 2영역 잘함",
    comment: "첫 번째 평어",
  },
  {
    id: "2",
    selected: true,
    number: 2,
    name: "이가람",
    reference: "",
    evaluation: "1영역 잘함 3영역 매우 잘함",
    comment: "두 번째 평어",
  },
];

describe("getTargetIds", () => {
  it("smart 모드에서 선택된 학생만 반환한다", () => {
    expect(getTargetIds(rows, "smart")).toEqual(["2"]);
  });

  it("smart 모드에서 선택이 없으면 전체 학생을 반환한다", () => {
    const unselected = rows.map((row) => ({ ...row, selected: false }));
    expect(getTargetIds(unselected, "smart")).toEqual(["1", "2"]);
  });

  it("selected 모드에서 선택이 없으면 빈 배열을 반환한다", () => {
    const unselected = rows.map((row) => ({ ...row, selected: false }));
    expect(getTargetIds(unselected, "selected")).toEqual([]);
  });
});

describe("row helpers", () => {
  it("다음 번호의 빈 행을 추가한다", () => {
    const result = addEmptyRow(rows);
    expect(result).toHaveLength(3);
    expect(result.at(-1)).toMatchObject({ number: 3, name: "", evaluation: "" });
  });

  it("선택된 행만 삭제한다", () => {
    expect(removeSelectedRows(rows).map((row) => row.id)).toEqual(["1"]);
  });

  it("대상 학생에게만 교과가 반영된 더미 평어를 넣는다", () => {
    const result = applyDummyComments(rows, ["2"], "국어");
    expect(result[0].comment).toBe("첫 번째 평어");
    expect(result[1].comment).toContain("국어");
  });
});

describe("exports", () => {
  it("표 내용을 탭으로 구분한 복사 문자열로 만든다", () => {
    expect(toClipboardText(rows)).toContain("번호\t성명\t평가결과\t학기말 종합의견");
    expect(toClipboardText(rows)).toContain("1\t김하늘");
  });

  it("한글 호환 BOM과 이스케이프된 CSV를 만든다", () => {
    const withQuote = [{ ...rows[0], comment: '친구의 "의견"을 경청함' }];
    const csv = toCsv(withQuote);
    expect(csv).toMatch(/^\uFEFF"번호","성명","평가결과","학기말 종합의견"/);
    expect(csv).toContain('"친구의 ""의견""을 경청함"');
  });
});
