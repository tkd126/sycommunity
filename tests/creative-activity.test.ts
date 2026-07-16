import { describe, expect, it } from "vitest";

import {
  normalizeCreativeActivities,
  normalizeCreativeCategory,
  normalizeCreativeDate,
  sanitizeCreativeComment,
} from "@/lib/creative-activity";

describe("creative activity normalization", () => {
  it.each([
    ["창체", "창체"],
    [" 자 율 ", "자율"],
    ["자", "자율"],
    ["봉사", "봉사"],
    ["봉", "봉사"],
    ["진로", "진로"],
    ["진", "진로"],
    ["동", "exclude"],
    [" 동 아 리 ", "exclude"],
    ["동아리 활동", "exclude"],
    ["계기교육", null],
    ["   ", null],
  ])("normalizes category %s", (source, expected) => {
    expect(normalizeCreativeCategory(source)).toBe(expected);
  });

  it.each([
    ["04.07", "4/7"],
    ["4/7", "4/7"],
    ["4-7", "4/7"],
    ["4월 7일", "4/7"],
    ["4.7(수)", "4/7"],
    [" 4월 7일 ", "4/7"],
    ["4.7(확인 필요)", null],
    ["4.7(미상)", null],
    ["13/7", null],
    ["4/31", null],
    ["날짜 미상", null],
    ["", null],
  ])("normalizes date %s", (source, expected) => {
    expect(normalizeCreativeDate(source)).toBe(expected);
  });

  it("sorts valid dates and preserves different same-date rows", () => {
    const rows = normalizeCreativeActivities([
      { date: "04.07", category: "자", activity: "다문화 교육", hours: 1, needsReview: false },
      { date: "날짜 미상", category: "창체", activity: "공동체 교육", hours: 1, needsReview: false },
      { date: "4/7", category: "진", activity: "진로 탐색", hours: 1, needsReview: false },
      { date: "4/8", category: "동", activity: "동아리 활동", hours: 2, needsReview: false },
      { date: "3월 4일", category: "봉", activity: "교내 환경 정리", hours: 1, needsReview: false },
    ]);

    expect(rows.map(({ date, category, activity }) => ({ date, category, activity }))).toEqual([
      { date: "3/4", category: "봉사", activity: "교내 환경 정리" },
      { date: "4/7", category: "자율", activity: "다문화 교육" },
      { date: "4/7", category: "진로", activity: "진로 탐색" },
      { date: "날짜 미상", category: "창체", activity: "공동체 교육" },
    ]);
    expect(new Set(rows.map(({ id }) => id)).size).toBe(rows.length);
  });

  it("collapses only exact normalized duplicates", () => {
    const rows = normalizeCreativeActivities([
      { date: "04.07", category: "자", activity: " 안전 교육 ", hours: 1, needsReview: false },
      { date: "4/7", category: "자율", activity: "안전 교육", hours: 1, needsReview: true },
      { date: "4/7", category: "자율", activity: "안전 교육", hours: 2, needsReview: false },
      { date: "4/7", category: "봉사", activity: "안전 교육", hours: 1, needsReview: false },
      { date: "4/7", category: "자율", activity: "교통 안전 교육", hours: 1, needsReview: false },
    ]);

    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      selected: true,
      date: "4/7",
      category: "자율",
      activity: "안전 교육",
      hours: 1,
      needsReview: true,
      comment: "",
    });
  });

  it("marks invalid hours and nonblank invalid dates for review", () => {
    const rows = normalizeCreativeActivities([
      { date: "날짜 미상", category: "창체", activity: "안전 교육", hours: 0, needsReview: false },
      { date: "4/7", category: "봉", activity: "환경 정리", hours: 1.5, needsReview: false },
      { date: "4/8", category: "진", activity: "진로 탐색", hours: 9, needsReview: true },
      { date: "", category: "자", activity: "날짜 없는 활동", hours: 1, needsReview: false },
      { date: "4/9", category: "기타", activity: "알 수 없는 구분", hours: 1, needsReview: false },
      { date: "4/10", category: "자", activity: "   ", hours: 1, needsReview: false },
    ]);

    expect(rows).toHaveLength(3);
    expect(rows.map(({ date, hours, needsReview }) => ({ date, hours, needsReview }))).toEqual([
      { date: "4/7", hours: 1, needsReview: true },
      { date: "4/8", hours: 1, needsReview: true },
      { date: "날짜 미상", hours: 1, needsReview: true },
    ]);
  });

  it("preserves non-weekday date suffixes as reviewable source text", () => {
    const rows = normalizeCreativeActivities([
      { date: " 4.7(확인 필요) ", category: "자", activity: "안전 교육", hours: 1, needsReview: false },
      { date: "4.7(미상)", category: "봉", activity: "환경 정리", hours: 1, needsReview: false },
    ]);

    expect(rows.map(({ date, needsReview }) => ({ date, needsReview }))).toEqual([
      { date: "4.7(확인 필요)", needsReview: true },
      { date: "4.7(미상)", needsReview: true },
    ]);
  });

  it("creates stable response-key-safe ids without personal data", () => {
    const input = [
      { date: "4/7", category: "자율", activity: "홍길동과 안전 교육", hours: 1, needsReview: false },
      { date: "4/7", category: "진로", activity: "홍길동과 진로 탐색", hours: 1, needsReview: false },
    ];

    const firstIds = normalizeCreativeActivities(input).map(({ id }) => id);
    const secondIds = normalizeCreativeActivities(input).map(({ id }) => id);

    expect(firstIds).toEqual(secondIds);
    expect(new Set(firstIds).size).toBe(2);
    expect(firstIds.every((id) => /^[a-z0-9-]+$/u.test(id))).toBe(true);
    expect(firstIds.join(" ")).not.toContain("홍길동");
  });
});

describe("creative activity comment sanitization", () => {
  it("turns the diversity sentence into a natural Korean noun-ending sentence", () => {
    expect(sanitizeCreativeComment("다문화교육을 통해 diversity를 이해했습니다!"))
      .toBe("다문화 교육을 통해 다양성을 이해함.");
  });

  it("generalizes product terms and leaves exactly one terminal period", () => {
    const comment = sanitizeCreativeComment(
      "LEGO와 레고, 클레이, 스크래치, 유튜브를 활용했습니다!!!\n",
    );

    expect(comment).toBe("블록 모형과 블록 모형, 점토, 블록형 코딩 도구, 영상 자료를 활용함.");
    expect(comment.match(/[.!?]/gu)).toHaveLength(1);
  });

  it("removes remaining Latin tokens without joining neighboring Korean words", () => {
    expect(sanitizeCreativeComment("우리ABC활동을 함께 했습니다..."))
      .toBe("우리 활동을 함께 함.");
  });

  it.each([
    ["친구를 도왔습니다!", "친구를 도왔음."],
    ["활동이 즐거웠습니다.", "활동이 즐거웠음."],
    ["협력의 결과입니다.", "협력의 결과임."],
  ])("guarantees a noun ending for %s", (source, expected) => {
    const comment = sanitizeCreativeComment(source);

    expect(comment).toBe(expected);
    expect(comment.match(/[.!?]/gu)).toHaveLength(1);
  });

  it.each([
    ["diversity와 협력을 배웠습니다.", "다양성과 협력을 배움."],
    ["diversity는 중요한 가치입니다.", "다양성은 중요한 가치임."],
    ["LEGO로 모형을 만들었습니다.", "블록 모형으로 모형을 만들었음."],
    ["레고와 클레이로 표현했습니다.", "블록 모형과 점토로 표현함."],
  ])("corrects particles after generalizing %s", (source, expected) => {
    expect(sanitizeCreativeComment(source)).toBe(expected);
  });
});
