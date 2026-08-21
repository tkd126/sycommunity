import type { AreaEvidence, StudentRow } from "@/types/report";
import type { DocumentAnalysisResponse } from "@/types/documents";

export type TargetMode = "smart" | "selected" | "all";

const DUMMY_COMMENTS = [
  "학습 내용을 차분히 이해하고 자신의 생각을 알맞은 근거와 함께 표현함. 수업 활동에 꾸준히 참여하며 친구의 의견을 경청하는 태도가 돋보임.",
  "배운 내용을 생활 속 사례와 연결하여 설명하고 주어진 과제를 성실하게 해결함. 여러 생각을 비교하며 자신의 의견을 또렷하게 나타냄.",
  "핵심 내용을 꼼꼼히 살피고 필요한 정보를 찾아 체계적으로 정리함. 모둠 활동에서 서로의 생각을 존중하며 맡은 역할에 책임감 있게 참여함.",
  "기초 개념을 바탕으로 문제를 해결하는 방법을 탐색하고 풀이 과정을 차근차근 설명함. 새로운 활동에도 관심을 가지고 적극적으로 참여함.",
  "학습 주제에 호기심을 가지고 다양한 방법으로 생각을 확장함. 도움을 받아 해결 방법을 익혀 가며 꾸준한 노력으로 발전하는 모습이 인상적임.",
] as const;

export const INITIAL_ROWS: StudentRow[] = [
  {
    id: "student-1",
    selected: false,
    number: 1,
    name: "김하늘",
    reference: "",
    evaluation: "",
    comment: "",
  },
  {
    id: "student-2",
    selected: false,
    number: 2,
    name: "이가람",
    reference: "",
    evaluation: "",
    comment: "",
  },
  {
    id: "student-3",
    selected: false,
    number: 3,
    name: "박도윤",
    reference: "",
    evaluation: "",
    comment: "",
  },
  {
    id: "student-4",
    selected: false,
    number: 4,
    name: "최서윤",
    reference: "",
    evaluation: "",
    comment: "",
  },
  {
    id: "student-5",
    selected: false,
    number: 5,
    name: "정시우",
    reference: "",
    evaluation: "",
    comment: "",
  },
];

export function createInitialRows(): StudentRow[] {
  return INITIAL_ROWS.map((row) => ({ ...row }));
}

export function syncRowsWithAnalysis(
  currentRows: StudentRow[],
  analysis: DocumentAnalysisResponse,
): StudentRow[] {
  const numbers = new Set(analysis.roster.map((student) => student.studentNumber));
  for (const area of analysis.areas) {
    for (const student of area.students) numbers.add(student.studentNumber);
  }

  const currentByNumber = new Map(currentRows.map((row) => [row.number, row]));

  return [...numbers].sort((a, b) => a - b).map((number) => {
    const current = currentByNumber.get(number);
    const evaluation = analysis.areas.map((area) => {
      const student = area.students.find((item) => item.studentNumber === number);
      return student?.level ? `${area.areaName} ${student.level}` : "";
    }).filter(Boolean).join("\n");

    return {
      id: current?.id ?? `student-${number}`,
      selected: current?.selected ?? false,
      number,
      name: `${number}번 학생`,
      reference: current?.reference ?? "",
      evaluation,
      comment: current?.comment ?? "",
    };
  });
}

export function getTargetIds(rows: StudentRow[], mode: TargetMode): string[] {
  if (mode === "all") return rows.map((row) => row.id);

  const selectedIds = rows.filter((row) => row.selected).map((row) => row.id);
  if (mode === "selected" || selectedIds.length > 0) return selectedIds;

  return rows.map((row) => row.id);
}

export function addEmptyRow(rows: StudentRow[]): StudentRow[] {
  const nextNumber = Math.max(0, ...rows.map((row) => row.number)) + 1;
  return [
    ...rows,
    {
      id: `student-${nextNumber}-${Date.now()}`,
      selected: false,
      number: nextNumber,
      name: "",
      reference: "",
      evaluation: "",
      comment: "",
    },
  ];
}

export function removeSelectedRows(rows: StudentRow[]): StudentRow[] {
  return rows.filter((row) => !row.selected);
}

export function applyDummyComments(rows: StudentRow[], targetIds: string[], subject: string): StudentRow[] {
  const targetSet = new Set(targetIds);
  return rows.map((row) => {
    if (!targetSet.has(row.id)) return row;
    const template = DUMMY_COMMENTS[(Math.max(1, row.number) - 1) % DUMMY_COMMENTS.length];
    return { ...row, comment: `${subject} 교과에서 ${template}` };
  });
}

export function toClipboardText(rows: StudentRow[]): string {
  const header = ["번호", "익명 성명", "과목", "선택된 영역", "영역별 성취 단계", "학기말 종합의견"];
  const body = rows.map((row) => [row.number, row.name, row.subject ?? "", row.selectedAreas?.join(" ") ?? "", row.evaluation, row.comment]);
  return [header, ...body].map((values) => values.join("\t")).join("\n");
}

function escapeCsv(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function toCsv(rows: StudentRow[]): string {
  const header = ["번호", "익명 성명", "과목", "선택된 영역", "영역별 성취 단계", "학기말 종합의견"];
  const body = rows.map((row) => [row.number, row.name, row.subject ?? "", row.selectedAreas?.join(" ") ?? "", row.evaluation, row.comment]);
  return `\uFEFF${[header, ...body].map((values) => values.map(escapeCsv).join(",")).join("\r\n")}`;
}

export function resizeAreaEvidence(current: AreaEvidence[], count: number): AreaEvidence[] {
  const safeCount = Math.min(5, Math.max(1, count));
  if (current.length >= safeCount) return current.slice(0, safeCount);

  const additions = Array.from({ length: safeCount - current.length }, (_, index) => ({
    id: `area-${current.length + index + 1}`,
    name: "",
    file: null,
  }));
  return [...current, ...additions];
}

export function isPdfFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".pdf");
}

export function isAllowedDocument(file: File): boolean {
  return [".hwp", ".hwpx", ".pdf"].some((extension) => file.name.toLowerCase().endsWith(extension));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round((bytes / 1024) * 10) / 10} KB`;
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}
