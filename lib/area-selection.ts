import type { AchievementLevel } from "@/types/documents";

export type AreaLevel = {
  areaName: string;
  level: AchievementLevel | "";
};

export type StudentAreaLevels = {
  studentNumber: number;
  levels: AreaLevel[];
};

const LEVEL_SCORE: Record<AchievementLevel, number> = {
  "매우 잘함": 4,
  "잘함": 3,
  "보통": 2,
  "노력 요함": 1,
};

function levelScore(level: AchievementLevel | "") {
  return level ? LEVEL_SCORE[level] : 0;
}

export function selectBalancedAreas(students: StudentAreaLevels[], count: number) {
  if (!Number.isInteger(count) || count < 1) throw new Error("반영 영역 수는 1개 이상이어야 합니다.");

  const areaOrder = new Map<string, number>();
  for (const student of students) {
    for (const level of student.levels) {
      if (!areaOrder.has(level.areaName)) areaOrder.set(level.areaName, areaOrder.size);
    }
  }
  const totalAreas = Math.max(1, areaOrder.size);
  const usage = new Map<string, number>();

  return [...students]
    .sort((a, b) => a.studentNumber - b.studentNumber)
    .map((student) => {
      if (student.levels.length < count) {
        throw new Error(`${student.studentNumber}번 학생의 반영 영역 수가 부족합니다.`);
      }

      const offset = (student.studentNumber - 1) % totalAreas;
      const selected = [...student.levels]
        .sort((a, b) => {
          const scoreDifference = levelScore(b.level) - levelScore(a.level);
          if (scoreDifference !== 0) return scoreDifference;
          const usageDifference = (usage.get(a.areaName) ?? 0) - (usage.get(b.areaName) ?? 0);
          if (usageDifference !== 0) return usageDifference;
          const aOrder = ((areaOrder.get(a.areaName) ?? 0) - offset + totalAreas) % totalAreas;
          const bOrder = ((areaOrder.get(b.areaName) ?? 0) - offset + totalAreas) % totalAreas;
          return aOrder - bOrder;
        })
        .slice(0, count);

      for (const level of selected) usage.set(level.areaName, (usage.get(level.areaName) ?? 0) + 1);
      return { studentNumber: student.studentNumber, selected };
    });
}
