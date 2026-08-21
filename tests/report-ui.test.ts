import { describe, expect, it } from "vitest";

import {
  addEmptyRow,
  applyDummyComments,
  getTargetIds,
  removeSelectedRows,
  toClipboardText,
  toCsv,
  formatFileSize,
  isAllowedDocument,
  isPdfFile,
  resizeAreaEvidence,
  syncRowsWithAnalysis,
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
  it("분석된 전체 번호에 맞춰 행을 추가하고 불필요한 행을 제거한다", () => {
    const result = syncRowsWithAnalysis(rows, {
      roster: [
        { studentNumber: 2 },
        { studentNumber: 3 },
      ],
      areas: [{
        areaId: "area-1",
        areaName: "문학",
        students: [
          { studentNumber: 2, level: "잘함", rawLevel: "잘함", confirmed: true },
          { studentNumber: 3, level: "매우 잘함", rawLevel: "매우잘함", confirmed: true },
        ],
        warnings: [],
      }],
      evaluationPlanText: "",
      worksheetText: "",
      warnings: [],
    });

    expect(result.map(({ number, name }) => ({ number, name }))).toEqual([
      { number: 2, name: "2번 학생" },
      { number: 3, name: "3번 학생" },
    ]);
    expect(result[0].comment).toBe("두 번째 평어");
    expect(result[1].evaluation).toBe("문학 매우 잘함");
  });

  it("명렬표에 이름이 없어도 영역에서 찾은 번호의 행을 만든다", () => {
    const result = syncRowsWithAnalysis([], {
      roster: [],
      areas: [{
        areaId: "area-1",
        areaName: "문법",
        students: [{ studentNumber: 27, level: "보통", rawLevel: "보통", confirmed: true }],
        warnings: [],
      }],
      evaluationPlanText: "",
      worksheetText: "",
      warnings: [],
    });

    expect(result).toMatchObject([{ number: 27, name: "27번 학생", evaluation: "문법 보통" }]);
  });

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
    expect(toClipboardText(rows)).toContain("번호\t익명 성명\t과목\t선택된 영역\t영역별 성취 단계\t학기말 종합의견");
    expect(toClipboardText(rows)).toContain("1\t김하늘");
  });

  it("한글 호환 BOM과 이스케이프된 CSV를 만든다", () => {
    const withQuote = [{ ...rows[0], comment: '친구의 "의견"을 경청함' }];
    const csv = toCsv(withQuote);
    expect(csv).toMatch(/^\uFEFF"번호","익명 성명","과목","선택된 영역","영역별 성취 단계","학기말 종합의견"/);
    expect(csv).toContain('"친구의 ""의견""을 경청함"');
  });
});

describe("area evidence helpers", () => {
  it("영역 수를 늘려도 앞쪽 입력을 보존한다", () => {
    const existing = [
      { id: "area-1", name: "문학", file: new File(["pdf"], "문학.pdf", { type: "application/pdf" }) },
      { id: "area-2", name: "읽기", file: null },
    ];

    const result = resizeAreaEvidence(existing, 3);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(existing[0]);
    expect(result[2]).toMatchObject({ name: "", file: null });
  });

  it("영역 수를 줄이면 앞쪽 행만 남긴다", () => {
    const existing = resizeAreaEvidence([], 3).map((area, index) => ({ ...area, name: `${index + 1}영역` }));
    expect(resizeAreaEvidence(existing, 2).map((area) => area.name)).toEqual(["1영역", "2영역"]);
  });

  it("영역 자료는 PDF만 허용한다", () => {
    expect(isPdfFile(new File(["pdf"], "문학.PDF", { type: "application/pdf" }))).toBe(true);
    expect(isPdfFile(new File(["hwp"], "문학.hwp", { type: "application/x-hwp" }))).toBe(false);
  });

  it("평가 계획과 수행평가지는 한글 문서와 PDF를 허용한다", () => {
    expect(isAllowedDocument(new File(["hwp"], "계획.hwp"))).toBe(true);
    expect(isAllowedDocument(new File(["hwpx"], "계획.hwpx"))).toBe(true);
    expect(isAllowedDocument(new File(["pdf"], "계획.pdf"))).toBe(true);
    expect(isAllowedDocument(new File(["doc"], "계획.docx"))).toBe(false);
  });

  it("파일 크기를 사람이 읽기 쉬운 값으로 표시한다", () => {
    expect(formatFileSize(0)).toBe("0 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2 MB");
  });
});
