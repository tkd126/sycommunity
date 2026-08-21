import type { AchievementLevel, ParsedRosterStudent, ParsedStudentLevel } from "@/types/documents";

const KNOWN_LEVEL = /(매우\s*잘함|잘\s*함|보통|노력\s*요함)/;
const COMMON_KOREAN_SURNAMES = "김이박최정강조윤장임한오서신권황안송류유홍전고문양손배백허남심노하곽성차주우구민";

function normalizeLevel(rawLevel: string): AchievementLevel | "" {
  const compact = rawLevel.replace(/\s/g, "");

  if (compact === "매우잘함") return "매우 잘함";
  if (compact === "잘함") return "잘함";
  if (compact === "보통") return "보통";
  if (compact === "노력요함") return "노력 요함";
  return "";
}

function isLikelyStudentName(token: string): boolean {
  return token.length >= 2 && token.length <= 4 && COMMON_KOREAN_SURNAMES.includes(token[0]);
}

export function parseAchievementLevels(text: string): ParsedStudentLevel[] {
  const studentsByNumber = new Map<number, ParsedStudentLevel>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (/^\d+\s*\/\s*\d+(?:\s+.*)?$/.test(line)) continue;
    const numberMatch = line.match(/^(\d+)\s+(.+)$/);
    if (!numberMatch) continue;

    const studentNumber = Number(numberMatch[1]);
    const remainder = numberMatch[2].trim();
    const knownMatch = remainder.match(KNOWN_LEVEL);
    const rawLevel = knownMatch?.[1] ?? remainder.split(/\s+/).at(-1) ?? "";
    const level = normalizeLevel(rawLevel);

    const nextStudent = {
      studentNumber,
      level,
      rawLevel,
      confirmed: level !== "",
    };
    const existingStudent = studentsByNumber.get(studentNumber);
    if (existingStudent) {
      if (
        existingStudent.confirmed &&
        nextStudent.confirmed &&
        existingStudent.level !== nextStudent.level
      ) {
        throw new Error(`학생 번호가 중복되었습니다: ${studentNumber}`);
      }
      if (!existingStudent.confirmed && nextStudent.confirmed) {
        studentsByNumber.set(studentNumber, nextStudent);
      }
      continue;
    }

    studentsByNumber.set(studentNumber, nextStudent);
  }

  return [...studentsByNumber.values()];
}

function extractAreaName(text: string): string {
  const criteriaCandidates: string[] = [];
  const fallbackCandidates: string[] = [];
  const singleCandidates: string[] = [];
  const hasNameColumn = text.includes("성명");

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (/^\d+\s*\/\s*\d+(?:\s+.*)?$/.test(line)) continue;
    const numberMatch = line.match(/^\d+\s+(.+)$/);
    if (!numberMatch) continue;

    const beforeLevel = numberMatch[1].split(KNOWN_LEVEL)[0].trim();
    const hasCriteriaCode = /\[[^\]]+\]/.test(beforeLevel);
    const beforeCriterion = beforeLevel.split(/\[[^\]]*\]/)[0].trim();
    const tokens = beforeCriterion.split(/\s+/).filter((token) => /^[가-힣]{1,10}$/.test(token));
    const areaTokens = (hasNameColumn || isLikelyStudentName(tokens[0] ?? "")) && tokens.length >= 2
      ? tokens.slice(1)
      : tokens.length >= 3
        ? tokens.slice(1)
        : tokens;
    const targetCandidates = hasCriteriaCode ? criteriaCandidates : fallbackCandidates;
    if (areaTokens.length >= 2) targetCandidates.push(areaTokens.join(" "));
    else if (areaTokens.length === 1 && tokens.length >= 2) targetCandidates.push(areaTokens[0]);
    else if (tokens.length === 1 && beforeLevel.includes("[")) singleCandidates.push(tokens[0]);
  }

  const strongCandidates = criteriaCandidates.length > 0 ? criteriaCandidates : fallbackCandidates;
  if (strongCandidates.length > 0) {
    const counts = new Map<string, number>();
    for (const candidate of strongCandidates) counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))[0][0];
  }

  const uniqueSingles = [...new Set(singleCandidates)];
  return uniqueSingles.length === 1 ? uniqueSingles[0] : "";
}

export function parseAchievementDocument(
  text: string,
): { areaName: string; students: ParsedStudentLevel[]; roster: ParsedRosterStudent[] } {
  const rosterByNumber = new Map<number, ParsedRosterStudent>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (/^\d+\s*\/\s*\d+(?:\s+.*)?$/.test(line)) continue;
    const numberMatch = line.match(/^(\d+)\s+(.+)$/);
    if (!numberMatch) continue;
    rosterByNumber.set(Number(numberMatch[1]), {
      studentNumber: Number(numberMatch[1]),
    });
  }

  const roster = [...rosterByNumber.values()];
  return { areaName: extractAreaName(text), students: parseAchievementLevels(text), roster };
}

export function extractStudentNames(text: string, areaName: string): string[] {
  const names = new Set<string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const numberMatch = line.match(/^\d+\s+(.+)$/);
    if (!numberMatch || /^\d+\s*\/\s*\d+/.test(line)) continue;
    const beforeLevel = numberMatch[1].split(KNOWN_LEVEL)[0].trim();
    const beforeCriterion = beforeLevel.split(/\[[^\]]*\]/)[0].trim();
    const tokens = beforeCriterion.split(/\s+/).filter((token) => /^[가-힣]{2,4}$/.test(token));
    if (tokens.length >= 2) names.add(tokens[0]);
    else if (tokens.length === 1 && tokens[0] !== areaName && beforeLevel.includes("[")) names.add(tokens[0]);
  }
  return [...names];
}
