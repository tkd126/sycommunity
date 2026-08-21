import { describe, expect, it } from "vitest";

import { parseAchievementDocument, parseAchievementLevels } from "@/lib/achievement-parser";

describe("parseAchievementLevels", () => {
  it("학생 번호와 성취 단계만 추출하고 이름은 결과에서 제외한다", () => {
    const result = parseAchievementLevels(`
      반/번호 성명 영역 단계
      1 김하늘 문학 매우잘함
      2 이가람 문학 잘 함
      3 박다온 문학 보통
      4 최라온 문학 노력요함
    `);

    expect(result).toEqual([
      { studentNumber: 1, level: "매우 잘함", rawLevel: "매우잘함", confirmed: true },
      { studentNumber: 2, level: "잘함", rawLevel: "잘 함", confirmed: true },
      { studentNumber: 3, level: "보통", rawLevel: "보통", confirmed: true },
      { studentNumber: 4, level: "노력 요함", rawLevel: "노력요함", confirmed: true },
    ]);
    expect(JSON.stringify(result)).not.toContain("김하늘");
  });

  it("지원하지 않는 단계는 미확인 상태로 남긴다", () => {
    expect(parseAchievementLevels("5 윤새봄 문학 참여함")).toEqual([
      { studentNumber: 5, level: "", rawLevel: "참여함", confirmed: false },
    ]);
  });

  it("학생 번호가 중복되면 명확한 오류를 낸다", () => {
    expect(() =>
      parseAchievementLevels("1 김하늘 문학 매우 잘함\n1 김하늘 문학 잘함"),
    ).toThrow("학생 번호가 중복되었습니다: 1");
  });

  it("페이지가 넘어가며 같은 학생 번호가 이어질 때는 확인된 성취 단계로 병합한다", () => {
    expect(parseAchievementLevels(`
      7 김찬율
      7 김찬율 에서 해결 방안 찾아보기 잘함
    `)).toEqual([
      { studentNumber: 7, level: "잘함", rawLevel: "잘함", confirmed: true },
    ]);
  });

  it("PDF 페이지 번호는 학생 번호로 해석하지 않는다", () => {
    expect(parseAchievementLevels("1 / 6 학교명\n1 문법 매우잘함 평가결과")).toEqual([
      { studentNumber: 1, level: "매우 잘함", rawLevel: "매우잘함", confirmed: true },
    ]);
  });
});

describe("parseAchievementDocument", () => {
  it("평가결과 표에서 영역명을 자동으로 추출한다", () => {
    expect(parseAchievementDocument(
      "반/번호 성명 영역 성취기준 단계\n1 김하늘 문법 [6국04-05] 매우잘함\n2 이가람 [6국04-05] 잘함",
    ).areaName).toBe("문법");
  });

  it("한 글자 영역명도 자동으로 추출한다", () => {
    expect(parseAchievementDocument(
      "반/번호 성명 영역 성취기준 단계\n1 김대한 법 [6사03-02] 잘함\n2 김민영 [6사03-02] 보통",
    ).areaName).toBe("법");
  });

  it("성명 다음부터 성취기준 코드 전까지의 여러 단어 영역명을 보존한다", () => {
    expect(parseAchievementDocument(
      "반/번호 성명 영역 성취기준 단계\n1 김대한 자연환경과 인간생활 [6사02-01] 잘함\n2 김민영 [6사02-01] 보통",
    ).areaName).toBe("자연환경과 인간생활");

    expect(parseAchievementDocument(
      "반/번호 성명 영역 성취기준 단계\n1 김대한 지리 인식 [6사01-01] 잘함\n2 김민영 [6사01-01] 보통",
    ).areaName).toBe("지리 인식");
  });

  it("평가결과 문장에 나온 단어를 영역명으로 오인하지 않는다", () => {
    expect(parseAchievementDocument(`
      1 김대한 지리 인식 [6사01-01] 우리나라 산지, 하천, 해안 지형의 위치를 확인하고 지형 잘함
      2 김민영 해안 지형의 위치를 확인하고 지형 보통
    `).areaName).toBe("지리 인식");

    expect(parseAchievementDocument(`
      1 김대한 법 [6사03-02] 일상생활에서 인권이 침해되는 사례를 찾아보기
      2 김민영 생활 속 인권 침해 사례를 분석하고 인권 존중 관점 보통
    `).areaName).toBe("법");
  });

  it("학생 번호만 익명 명렬표로 추출한다", () => {
    expect(parseAchievementDocument("1 김하늘 문학 [6국04-05] 매우잘함")).toEqual({
      areaName: "문학",
      students: [
        { studentNumber: 1, level: "매우 잘함", rawLevel: "매우잘함", confirmed: true },
      ],
      roster: [{ studentNumber: 1 }],
    });
  });

  it("성명이 삭제된 자료의 영역명을 학생 이름으로 오인하지 않는다", () => {
    expect(parseAchievementDocument("1 문법 [6국04-05] 매우잘함").roster).toEqual([
      { studentNumber: 1 },
    ]);
  });

  it("영역 셀이 생략된 학생 행에서도 번호만 유지한다", () => {
    expect(parseAchievementDocument("2 이가람 [6국04-05] 잘함").roster).toEqual([
      { studentNumber: 2 },
    ]);
  });

  it("성명과 영역이 빈 행의 평가 문구를 이름으로 오인하지 않는다", () => {
    expect(parseAchievementDocument(
      "1 표현을 다양하게 활용하여 자신의 생각을 나타냄 매우잘함",
    ).roster).toEqual([{ studentNumber: 1 }]);
  });

  it("원래 성명을 분석 결과에 남기지 않는다", () => {
    const result = parseAchievementDocument("1 김하늘 문법 [6국04-05] 매우잘함");
    expect(result.roster).toEqual([{ studentNumber: 1 }]);
    expect(JSON.stringify(result)).not.toContain("김하늘");
  });

  it("페이지 이어짐으로 같은 번호가 반복되어도 익명 명렬표는 한 번만 남긴다", () => {
    expect(parseAchievementDocument(`
      7 김찬율
      7 김찬율 에서 해결 방안 찾아보기 잘함
    `).roster).toEqual([{ studentNumber: 7 }]);
  });
});
