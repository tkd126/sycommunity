import { describe, expect, it } from "vitest";

import {
  chooseSpecificCreativeActivity,
  normalizeCreativeActivities,
  normalizeCreativeCategory,
  normalizeCreativeDate,
  parseCreativeTimetableLocally,
  sanitizeCreativeComment,
} from "@/lib/creative-activity";

describe("creative activity normalization", () => {
  it("uses the more specific item when comma-separated activities describe the same topic", () => {
    expect(chooseSpecificCreativeActivity("학교폭력예방교육, 사이버 학교 폭력 교육"))
      .toBe("사이버 학교 폭력 교육");
    expect(chooseSpecificCreativeActivity("국악교육6, 단소 배우기 국악교육"))
      .toBe("단소 배우기 국악교육");
  });

  it("keeps different comma-separated activities together", () => {
    expect(chooseSpecificCreativeActivity("개인위생교육, 학급자치회선출"))
      .toBe("개인위생교육, 학급자치회선출");
  });

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
    ["3. 4.(수)", "3/4"],
    ["2026.3.4", "3/4"],
    ["2026년 3월 4일", "3/4"],
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

describe("creative timetable local parsing", () => {
  it("표준 연간시간표의 날짜·창체 과목을 로컬에서 연결하고 동아리는 제외한다", () => {
    const text = [
      "교육과정 연간시간운영계획",
      "2026학년도 1학기",
      "1",
      "3. 2- 3. 6",
      "5",
      "국", "국", "수", "수", "과", "과",
      "자", "국", "수", "사", "과", "미",
      "국", "수", "사", "과", "영", "체",
      "국", "수", "사", "과", "영", "체",
      "자", "국", "수", "사", "미",
      "3.3(화) 학교폭력예방교육",
      "3.6(금) 학급자치회선출",
      "3.6(금) 동아리 1",
    ].join("\n");

    const rows = parseCreativeTimetableLocally(text);

    expect(rows?.map(({ date, category, activity, hours, needsReview }) => ({
      date,
      category,
      activity,
      hours,
      needsReview,
    }))).toEqual([
      { date: "3/3", category: "자율", activity: "학교폭력예방교육", hours: 1, needsReview: false },
      { date: "3/6", category: "자율", activity: "학급자치회선출", hours: 1, needsReview: false },
    ]);
  });

  it("표준 시간표 표제를 찾지 못하면 기존 분석기로 넘길 수 있도록 null을 반환한다", () => {
    expect(parseCreativeTimetableLocally("3.3(화) 학교폭력예방교육")).toBeNull();
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

  it.each([
    ["diversity가치를 배웠습니다.", "다양성가치를 배움."],
    ["클레이과정을 살펴봤습니다.", "점토과정을 살펴봤음."],
  ])("does not mistake a word prefix for a particle in %s", (source, expected) => {
    expect(sanitizeCreativeComment(source)).toBe(expected);
  });

  it.each([
    ["생각을 나눕니다.", "생각을 나눔."],
    ["작품을 봅니다.", "작품을 봄."],
    ["정답이 아닙니다.", "정답이 아님."],
    ["작품을 만듭니다.", "작품을 만듦."],
    ["함께 놉니다.", "함께 놂."],
  ])("safely converts common -ㅂ니다 endings in %s", (source, expected) => {
    const comment = sanitizeCreativeComment(source);

    expect(comment).toBe(expected);
    expect(comment.match(/[.!?]/gu)).toHaveLength(1);
  });
});
