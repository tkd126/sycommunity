const REPLACEMENTS: Array<[RegExp, string]> = [
  [/레고를/gi, "블록 장난감을 활용하며"],
  [/레고/gi, "블록 장난감"],
  [/클레이/gi, "점토"],
  [/스크래치/gi, "블록형 코딩 도구"],
  [/비티에스/gi, "대중가요"],
  [/학생은\s*/g, ""],
  [/학생의\s*/g, ""],
  [/그는\s*/g, ""],
  [/그의\s*/g, ""],
  [/어린이/g, ""],
  [/잘하지\s*못함/g, "해결 방법을 익혀 가고 있음"],
  [/어려움이\s*큼/g, "도움을 받아 해결하려 노력함"],
  [/부족함/g, "기초를 다지며 점차 향상되고 있음"],
  [/미달함/g, "기초를 다지며 익혀 가고 있음"],
  [/못함/g, "노력함"],
];

const BANNED_TERMS = [
  "모범생",
  "장애우",
  "그는",
  "그의",
  "학생은",
  "학생의",
  "어린이",
  "미달함",
  "못함",
  "부족함",
  "어려움이 큼",
  "잘하지 못함",
];

export function sanitizeComment(input: string): string {
  const replaced = REPLACEMENTS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    input,
  );

  return replaced
    .replace(/[A-Za-z]/g, "")
    .replace(/[^가-힣0-9\s.,]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,])/g, "$1")
    .trim();
}

export function findCommentViolations(input: string): string[] {
  const violations = BANNED_TERMS.filter((term) => input.includes(term));
  if (/[A-Za-z]/.test(input)) violations.push("외국어");
  if (/[^가-힣0-9\s.,]/.test(input)) violations.push("특수문자");
  return [...new Set(violations)];
}
