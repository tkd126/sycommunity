import { HwpxReader } from "@ssabrojs/hwpxjs";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import {
  createCreativeActivityDocx,
  createCreativeActivityHwpx,
} from "@/lib/creative-activity-export";
import type { CreativeActivityRow } from "@/types/creative-activity";

const rows: CreativeActivityRow[] = [
  {
    id: "activity-1",
    selected: true,
    date: "3/4",
    hours: 1,
    category: "자율",
    activity: "학교폭력 예방 교육",
    needsReview: false,
    comment: "학교폭력 예방 교육에 참여하여 친구 사이에 지켜야 할 언어 예절을 익히고 서로 존중하는 태도를 기름.",
  },
  {
    id: "activity-2",
    selected: true,
    date: "6/30",
    hours: 2,
    category: "진로",
    activity: "진로 적성 검사",
    needsReview: false,
    comment: "진로 적성 검사에 참여하여 자신의 흥미와 적성을 살펴보고 앞으로의 진로 방향을 탐색함.",
  },
];

function firstZipEntry(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(view.getUint32(0, true)).toBe(0x04034b50);
  const compressedSize = view.getUint32(18, true);
  const fileNameLength = view.getUint16(26, true);
  const extraLength = view.getUint16(28, true);
  const nameStart = 30;
  const contentStart = nameStart + fileNameLength + extraLength;

  return {
    name: new TextDecoder().decode(bytes.slice(nameStart, nameStart + fileNameLength)),
    content: new TextDecoder().decode(bytes.slice(contentStart, contentStart + compressedSize)),
  };
}

describe("createCreativeActivityHwpx", () => {
  it("예시 한글 파일과 같은 표 구조로 유효한 HWPX를 만든다", async () => {
    const bytes = await createCreativeActivityHwpx(rows, "1");

    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(firstZipEntry(bytes)).toEqual({
      name: "mimetype",
      content: "application/hwp+zip",
    });

    const zip = await JSZip.loadAsync(bytes);
    const version = await zip.file("version.xml")!.async("string");
    const section = await zip.file("Contents/section0.xml")!.async("string");
    expect(version).toContain("http://www.hancom.co.kr/hwpml/2011/version");
    expect(version).toContain('targetApplication="WORDPROCESSOR"');
    expect(section).toContain(rows[0].comment);
    expect(section).not.toMatch(/\shp:[A-Za-z][\w-]*=/u);

    const reader = new HwpxReader();
    const copy = new Uint8Array(bytes);
    await reader.loadFromArrayBuffer(copy.buffer);
    const text = await reader.extractText();

    expect(text).toMatch(/주\s+날짜\s+시수\s+학습 주제\s+세부 사항 기록/u);
    expect(text).toContain("3/4");
    expect(text).toContain("학교폭력 예방 교육");
    expect(text).toContain(rows[0].comment);
    expect(text).toContain("(진로) 진로 적성 검사");
    expect(text).toContain(rows[1].comment);
  });

  it("현재 수정된 평어를 담은 호환용 DOCX도 만든다", async () => {
    const editedRows = [
      { ...rows[0], comment: "교사가 화면에서 직접 고친 최종 평어임." },
    ];
    const bytes = await createCreativeActivityDocx(editedRows, "1");
    const zip = await JSZip.loadAsync(bytes);
    const document = await zip.file("word/document.xml")!.async("string");

    expect(document).toContain("교사가 화면에서 직접 고친 최종 평어임.");
    expect(document).toContain("학교폭력 예방 교육");
    expect(document).toContain("3/4");
  });
});
