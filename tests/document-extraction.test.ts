import { describe, expect, it } from "vitest";

import {
  applyPdfViewportTransform,
  extractDocumentText,
  extractAreaNameFromPdfItems,
  groupPdfTextItems,
} from "@/lib/document-extraction";

describe("extractDocumentText", () => {
  it("PDF 헤더 좌표를 기준으로 영역 열의 값을 추출한다", () => {
    expect(extractAreaNameFromPdfItems([
      { str: "성명", transform: [1, 0, 0, 1, 106, 700] },
      { str: "영역", transform: [1, 0, 0, 1, 188, 700] },
      { str: "성취기준", transform: [1, 0, 0, 1, 316, 700] },
      { str: "김하늘", transform: [1, 0, 0, 1, 106, 650] },
      { str: "문법", transform: [1, 0, 0, 1, 189, 620] },
      { str: "시간 표현을 이해함", transform: [1, 0, 0, 1, 255, 650] },
    ])).toBe("문법");
  });

  it("나이스 PDF에서 한 글자로 추출되는 영역명도 인정한다", () => {
    expect(extractAreaNameFromPdfItems([
      { str: "성명", transform: [1, 0, 0, 1, 106, 700] },
      { str: "영역", transform: [1, 0, 0, 1, 188, 700] },
      { str: "성취기준", transform: [1, 0, 0, 1, 316, 700] },
      { str: "김대한", transform: [1, 0, 0, 1, 102, 650] },
      { str: "법", transform: [1, 0, 0, 1, 194, 550] },
      { str: "[6사03-02] 일상생활에서 인권이", transform: [1, 0, 0, 1, 255, 650] },
    ])).toBe("법");
  });

  it("공백이 포함된 나이스 영역명도 좌표 기반으로 추출한다", () => {
    expect(extractAreaNameFromPdfItems([
      { str: "성명", transform: [1, 0, 0, 1, 106, 700] },
      { str: "영역", transform: [1, 0, 0, 1, 188, 700] },
      { str: "성취기준", transform: [1, 0, 0, 1, 316, 700] },
      { str: "김대한", transform: [1, 0, 0, 1, 102, 650] },
      { str: "지리 인식", transform: [1, 0, 0, 1, 176, 550] },
      { str: "[6사01-01] 우리나라 산지", transform: [1, 0, 0, 1, 255, 650] },
    ])).toBe("지리 인식");
  });
  it("같은 높이의 PDF 표 셀을 한 학생 행으로 묶는다", () => {
    expect(groupPdfTextItems([
      { str: "매우잘함", transform: [1, 0, 0, 1, 500, 700] },
      { str: "김하늘", transform: [1, 0, 0, 1, 100, 700] },
      { str: "1", transform: [1, 0, 0, 1, 30, 700] },
      { str: "2", transform: [1, 0, 0, 1, 30, 680] },
      { str: "잘함", transform: [1, 0, 0, 1, 500, 680] },
    ])).toBe("1 김하늘 매우잘함\n2 잘함");
  });

  it("회전된 PDF 좌표를 화면 기준 좌표로 변환한다", () => {
    const result = applyPdfViewportTransform(
      { str: "1", transform: [1, 0, 0, 1, 20, 30] },
      [0, 1, 1, 0, 0, 0],
    );

    expect(result.transform[4]).toBe(30);
    expect(result.transform[5]).toBe(-20);
  });

  it("지원하지 않는 문서 형식을 거부한다", async () => {
    await expect(
      extractDocumentText(new Uint8Array([1, 2]), "plan.docx"),
    ).rejects.toThrow("지원하지 않는 문서 형식입니다");
  });

  it.each(["empty.pdf", "empty.hwp", "empty.hwpx"])(
    "빈 %s 문서는 읽을 수 있는 글자가 없다고 안내한다",
    async (fileName) => {
      await expect(extractDocumentText(new Uint8Array(), fileName)).rejects.toThrow(
        "문서에서 읽을 수 있는 글자를 찾지 못했습니다",
      );
    },
  );
});
