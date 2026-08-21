import { describe, expect, it } from "vitest";

import { generateClubActivityRecord, sanitizeClubActivityText } from "@/lib/club-record";

describe("club activity record wording", () => {
  it("keeps the exhibition at the chronological end without inventing participation", () => {
    const record = generateClubActivityRecord("레고 블록을 활용해 경복궁을 만들었다.");

    expect(record.length).toBeGreaterThanOrEqual(35);
    expect(record.length).toBeLessThanOrEqual(90);
    expect(record).toContain("블록 모형");
    expect(record).toContain("건축물");
    expect(record).toMatch(/제작|완성/);
    expect(record).toMatch(/전시함\.$/);
    expect(record).not.toMatch(/꾸준|성실|끈기|노력/);
    expect(record.match(/[.!?]/g)).toHaveLength(1);
    expect(record).toMatch(/함\.$/);
  });

  it("generalizes idol song references and creates a noun-ending activity record", () => {
    const record = generateClubActivityRecord("아이돌 노래에 맞추어 춤연습을 했다.");

    expect(record.length).toBeGreaterThanOrEqual(35);
    expect(record.length).toBeLessThanOrEqual(90);
    expect(record).toMatch(/춤 동작.*연습.*발표/);
    expect(record).not.toMatch(/꾸준|성실|끈기|노력/);
    expect(record).toMatch(/발표함\.$/);
    expect(record.match(/[.!?]/g)).toHaveLength(1);
    expect(record).toMatch(/함\.$/);
    expect(record).not.toContain("아이돌");
  });

  it.each([
    ["점토 작품을 매 시간 열심히 만들었다.", /매 시간 성실히 참여하며.*작품으로 완성함\.$/],
    ["블록형 코딩 도구로 프로그램을 끝까지 만들며 끈기를 보였다.", /끈기 있게.*프로그램을 완성함\.$/],
  ])("uses an input-grounded participation clause for %s", (note, expectedEnding) => {
    const record = generateClubActivityRecord(note);

    expect(record.length).toBeGreaterThanOrEqual(35);
    expect(record.length).toBeLessThanOrEqual(110);
    expect(record).toMatch(expectedEnding);
    expect(record.match(/[.!?]/g)).toHaveLength(1);
  });

  it("keeps a long general fallback within the target length and noun-ending sentence form", () => {
    const record = generateClubActivityRecord(
      "여러 종류의 재료를 차례대로 살펴보고 쓰임에 따라 분류한 뒤 서로 어울리는 재료를 골라 조합하며 작업 순서를 기록하고 결과를 정리했다.",
    );

    expect(record.length).toBeGreaterThanOrEqual(70);
    expect(record.length).toBeLessThanOrEqual(110);
    expect(record.match(/[.!?]/g)).toHaveLength(1);
    expect(record).toMatch(/함\.$/);
  });

  it("generalizes common virtual creation platforms without leaving the product name", () => {
    const record = generateClubActivityRecord("로블록스에서 가상 공간을 구성했다.");

    expect(sanitizeClubActivityText("마인크래프트와 유튜브를 활용했다")).toBe(
      "블록형 가상 창작 도구와 영상 자료를 활용했다",
    );
    expect(record).toContain("가상 창작 공간");
    expect(record).not.toContain("로블록스");
    expect(record.length).toBeLessThanOrEqual(110);
  });

  it("does not invent awards or measured ability for a neutral creation activity", () => {
    const record = generateClubActivityRecord("레고 블록을 활용해 경복궁을 만들었다.");

    expect(record).not.toMatch(/수상|입상|우승|재능|능력|탁월|우수|뛰어|최고|완벽/);
  });

  it("does not mistake performance preparation for a ball sport", () => {
    const record = generateClubActivityRecord("공연 준비를 위해 순서를 정리했다.");

    expect(record).not.toContain("공을 다루는 이동 동작");
    expect(record).toContain("공연 준비");
  });

  it("keeps explicit ball handling and passing in the sports branch", () => {
    const record = generateClubActivityRecord("공을 활용한 패스 연습을 했다.");

    expect(record).toContain("공을 다루는 이동 동작");
    expect(record).toContain("기본 기술을 반복해 연습");
  });

  it("allows ordinary positive qualitative expressions while generalizing product names", () => {
    expect(sanitizeClubActivityText("성실하게 레고 작품을 만들었다")).toBe(
      "성실하게 블록 모형 작품을 만들었다",
    );
  });

  it.each([
    "레고 블록을 활용해 경복궁을 만들었다.",
    "아이돌 노래에 맞추어 춤연습을 했다.",
    "점토 작품을 매 시간 열심히 만들었다.",
  ])("avoids chaining the same connective repeatedly for %s", (note) => {
    const record = generateClubActivityRecord(note);

    expect(record).not.toMatch(/하고[^.]*하고/u);
    expect(record).not.toMatch(/하며[^.]*하며/u);
  });

  it("removes complaint-prone overclaiming or comparison expressions", () => {
    expect(sanitizeClubActivityText("친구보다 뛰어나게 완벽하게 레고 작품을 만들었다")).toBe(
      "블록 모형 작품을 만들었다",
    );
  });
});
