import type {
  CreativeActivityRow,
  CreativeCategory,
  RawCreativeActivity,
} from "@/types/creative-activity";

const CATEGORY_MAP: Record<string, CreativeCategory | "exclude"> = {
  창체: "창체",
  자율: "자율",
  자: "자율",
  봉사: "봉사",
  봉: "봉사",
  진로: "진로",
  진: "진로",
  동: "exclude",
  동아리: "exclude",
  동아리활동: "exclude",
};

const PRODUCT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/diversity/gi, "다양성"],
  [/LEGO/gi, "블록 모형"],
  [/레고/gu, "블록 모형"],
  [/클레이/gu, "점토"],
  [/스크래치/gu, "블록형 코딩 도구"],
  [/유튜브/gu, "영상 자료"],
];

type NormalizedEntry = {
  row: CreativeActivityRow;
  originalIndex: number;
  dateParts: [number, number] | null;
};

export function normalizeCreativeCategory(
  value: string,
): CreativeCategory | "exclude" | null {
  const compact = value.replace(/\s+/gu, "");
  return CATEGORY_MAP[compact] ?? null;
}

export function normalizeCreativeDate(value: string): string | null {
  const match = value.trim().match(
    /^(\d{1,2})\s*(?:월\s*|[./-])\s*(\d{1,2})\s*(?:일)?\s*(?:\([^()]+\))?$/u,
  );
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const lastDay = new Date(2000, month, 0).getDate();
  if (month < 1 || month > 12 || day < 1 || day > lastDay) return null;

  return `${month}/${day}`;
}

function responseKeyHash(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function normalizeCreativeActivities(
  rows: RawCreativeActivity[],
): CreativeActivityRow[] {
  const entriesByDuplicateKey = new Map<string, NormalizedEntry>();
  const usedIds = new Set<string>();

  rows.forEach((source, originalIndex) => {
    const category = normalizeCreativeCategory(source.category);
    const rawDate = source.date.trim();
    const activity = source.activity.replace(/\s+/gu, " ").trim();
    if (!rawDate || !activity || !category || category === "exclude") return;

    const normalizedDate = normalizeCreativeDate(rawDate);
    const date = normalizedDate ?? rawDate;
    const validHours = Number.isInteger(source.hours) && source.hours >= 1 && source.hours <= 8;
    const hours = validHours ? source.hours : 1;
    const duplicateKey = JSON.stringify([date, category, activity, hours]);
    const duplicate = entriesByDuplicateKey.get(duplicateKey);

    if (duplicate) {
      duplicate.row.needsReview ||= source.needsReview || !normalizedDate || !validHours;
      return;
    }

    const baseId = `creative-${responseKeyHash(duplicateKey)}`;
    let id = baseId;
    let collisionNumber = 2;
    while (usedIds.has(id)) {
      id = `${baseId}-${collisionNumber}`;
      collisionNumber += 1;
    }
    usedIds.add(id);

    entriesByDuplicateKey.set(duplicateKey, {
      row: {
        id,
        selected: true,
        date,
        category,
        activity,
        hours,
        needsReview: source.needsReview || !normalizedDate || !validHours,
        comment: "",
      },
      originalIndex,
      dateParts: normalizedDate
        ? (normalizedDate.split("/").map(Number) as [number, number])
        : null,
    });
  });

  return [...entriesByDuplicateKey.values()]
    .sort((left, right) => {
      if (left.dateParts && right.dateParts) {
        return left.dateParts[0] - right.dateParts[0]
          || left.dateParts[1] - right.dateParts[1]
          || left.originalIndex - right.originalIndex;
      }
      if (left.dateParts) return -1;
      if (right.dateParts) return 1;
      return left.originalIndex - right.originalIndex;
    })
    .map(({ row }) => row);
}

function correctReplacementParticles(value: string) {
  return value
    .replace(/다양성를/gu, "다양성을")
    .replace(/다양성가/gu, "다양성이")
    .replace(/블록 모형와/gu, "블록 모형과")
    .replace(/블록 모형를/gu, "블록 모형을")
    .replace(/블록 모형는/gu, "블록 모형은")
    .replace(/블록 모형가/gu, "블록 모형이");
}

function toNounEnding(value: string) {
  return value
    .replace(/다짐(?:했|하였)습니다$/u, "다짐")
    .replace(/느꼈습니다$/u, "느낌")
    .replace(/익혔습니다$/u, "익힘")
    .replace(/길렀습니다$/u, "기름")
    .replace(/배웠습니다$/u, "배움")
    .replace(/알았습니다$/u, "앎")
    .replace(/(?:하였습니다|했습니다|하였음|했음|하였다|했다)$/u, "함")
    .replace(/합니다$/u, "함")
    .replace(/됩니다$/u, "됨")
    .replace(/있습니다$/u, "있음")
    .replace(/없습니다$/u, "없음")
    .replace(/보였습니다$/u, "보임");
}

export function sanitizeCreativeComment(value: string): string {
  let sanitized = PRODUCT_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value,
  );

  sanitized = correctReplacementParticles(sanitized)
    .replace(/다문화교육/gu, "다문화 교육")
    .replace(/[A-Za-z]+/g, " ")
    .replace(/[.!?。！？…]+/gu, " ")
    .replace(/[,，]+/gu, ",")
    .replace(/[;；:：]+/gu, ",")
    .replace(/\s+/gu, " ")
    .replace(/\s+,/gu, ",")
    .replace(/,\s*,+/gu, ",")
    .trim();

  sanitized = toNounEnding(sanitized).trim();
  return sanitized ? `${sanitized}.` : "";
}
