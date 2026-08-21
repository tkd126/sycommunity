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
    /^(?:20\d{2}\s*(?:년\s*|[./-]\s*))?(\d{1,2})\s*(?:월\s*|[./-])\s*(\d{1,2})\s*(?:일|\.)?\s*(?:\(\s*[월화수목금토일]\s*\))?$/u,
  );
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const lastDay = new Date(2000, month, 0).getDate();
  if (month < 1 || month > 12 || day < 1 || day > lastDay) return null;

  return `${month}/${day}`;
}

function comparableActivity(value: string) {
  return value
    .replace(/\d+/gu, "")
    .replace(/[^\p{Script=Hangul}]/gu, "")
    .trim();
}

function longestCommonSubstringLength(left: string, right: string) {
  if (!left || !right) return 0;
  const previous = new Array<number>(right.length + 1).fill(0);
  let longest = 0;

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = new Array<number>(right.length + 1).fill(0);
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      if (left[leftIndex - 1] !== right[rightIndex - 1]) continue;
      current[rightIndex] = previous[rightIndex - 1] + 1;
      longest = Math.max(longest, current[rightIndex]);
    }
    previous.splice(0, previous.length, ...current);
  }

  return longest;
}

function activitiesOverlap(left: string, right: string) {
  const normalizedLeft = comparableActivity(left);
  const normalizedRight = comparableActivity(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) return true;

  const commonLength = longestCommonSubstringLength(normalizedLeft, normalizedRight);
  const shorterLength = Math.min(normalizedLeft.length, normalizedRight.length);
  return commonLength >= 4 && commonLength / shorterLength >= 0.5;
}

export function chooseSpecificCreativeActivity(activity: string) {
  const candidates = activity
    .split(/\s*[,，;]\s*/u)
    .map((candidate) => candidate.trim())
    .filter(Boolean);
  if (candidates.length < 2) return activity.trim();

  const groups: string[][] = [];
  candidates.forEach((candidate) => {
    const matchingGroup = groups.find((group) => group.some((item) => activitiesOverlap(item, candidate)));
    if (matchingGroup) matchingGroup.push(candidate);
    else groups.push([candidate]);
  });

  return groups
    .map((group) => [...group].sort((left, right) => comparableActivity(right).length - comparableActivity(left).length)[0])
    .join(", ");
}

const TIMETABLE_DATE_PREFIX_PATTERN = /^(\s*)((?:20\d{2}\s*(?:년\s*|[./-]\s*))?\d{1,2}\s*(?:월\s*|[./-])\s*\d{1,2}\s*(?:일|\.)?\s*(?:\(\s*[월화수목금토일]\s*\))?)\s+(.+)$/u;

export function annotateCreativeTimetableDates(text: string): string {
  return text
    .split(/\r?\n/u)
    .map((line) => {
      const match = line.match(TIMETABLE_DATE_PREFIX_PATTERN);
      if (!match) return line;

      const normalizedDate = normalizeCreativeDate(match[2]);
      if (!normalizedDate) return line;

      return `${match[1]}[확정 날짜 ${normalizedDate}] ${match[3].trimStart()}`;
    })
    .join("\n");
}

export function selectCreativeSemesterText(text: string, semester: "1" | "2"): string {
  const semesterMarker = new RegExp(`20\\d{2}학년도\\s*${semester}학기`, "u");
  const selectedMatch = semesterMarker.exec(text);
  if (!selectedMatch) return text;

  const selectedStart = selectedMatch.index;
  const remainingText = text.slice(selectedStart + selectedMatch[0].length);
  const nextSemesterMatch = /20\d{2}학년도\s*[12]학기/u.exec(remainingText);
  const selectedEnd = nextSemesterMatch
    ? selectedStart + selectedMatch[0].length + nextSemesterMatch.index
    : text.length;
  const selectedText = text.slice(selectedStart, selectedEnd).trim();

  return selectedText || text;
}

const LOCAL_TIMETABLE_TITLE_PATTERN = /교육과정\s*연간시간운영계획/u;
const LOCAL_WEEK_RANGE_PATTERN = /^(\d{1,2})\s*\.\s*(\d{1,2})\s*-\s*(\d{1,2})\s*\.\s*(\d{1,2})$/u;
const LOCAL_NOTE_PATTERN = /^(\d{1,2})\s*\.\s*(\d{1,2})\s*\(\s*([월화수목금])\s*\)\s*(.+)$/u;
const LOCAL_SUBJECT_PATTERN = /^(?:창체|자|봉|진|동|국|수|사|과|영|음|미|체|실|도)$/u;
const LOCAL_HOLIDAY_PATTERN = /(?:휴업일|휴일|어린이날|근로자의\s*날|지방선거일|추석(?:연휴)?|한글날|제헌절)$/u;
const LOCAL_WEEKDAY_INDEX: Record<string, number> = { 월: 0, 화: 1, 수: 2, 목: 3, 금: 4 };
const LOCAL_DAILY_PERIODS = [6, 6, 6, 6, 5] as const;

type LocalTimetableNote = {
  date: string;
  weekday: number;
  activity: string;
};

function parseLocalNote(line: string): LocalTimetableNote | null {
  const match = line.match(LOCAL_NOTE_PATTERN);
  if (!match) return null;
  const date = normalizeCreativeDate(`${match[1]}.${match[2]}`);
  const weekday = LOCAL_WEEKDAY_INDEX[match[3]];
  const activity = match[4].replace(/\s+/gu, " ").trim();
  return date && Number.isInteger(weekday) && activity
    ? { date, weekday, activity }
    : null;
}

function dateAt(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

function weekdaysInRange(
  year: number,
  rangeMatch: RegExpMatchArray,
): number[] {
  const start = dateAt(year, Number(rangeMatch[1]), Number(rangeMatch[2]));
  const end = dateAt(year, Number(rangeMatch[3]), Number(rangeMatch[4]));
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) return [];

  const weekdays: number[] = [];
  for (
    let current = start;
    current <= end && weekdays.length < 5;
    current = new Date(current.getTime() + 86_400_000)
  ) {
    const day = current.getUTCDay();
    if (day >= 1 && day <= 5) weekdays.push(day - 1);
  }
  return weekdays;
}

function fitDayLengths(activeWeekdays: number[], subjectCount: number): Map<number, number> {
  const lengths = new Map<number, number>(activeWeekdays.map((weekday) => [
    weekday,
    LOCAL_DAILY_PERIODS[weekday],
  ]));
  let total = [...lengths.values()].reduce((sum, value) => sum + value, 0);

  while (total > subjectCount) {
    let changed = false;
    for (const weekday of activeWeekdays) {
      const current = lengths.get(weekday) ?? 0;
      if (current <= 1 || total <= subjectCount) continue;
      lengths.set(weekday, current - 1);
      total -= 1;
      changed = true;
    }
    if (!changed) break;
  }
  while (total < subjectCount && activeWeekdays.length > 0) {
    for (const weekday of activeWeekdays) {
      if (total >= subjectCount) break;
      lengths.set(weekday, (lengths.get(weekday) ?? 0) + 1);
      total += 1;
    }
  }
  return lengths;
}

function creativeCategoryForDay(
  subjectCodes: string[],
  activity: string,
): CreativeCategory | null {
  if (/동아리/u.test(activity)) return null;
  const available = new Set(subjectCodes);
  if (available.has("진") && /(?:진로|직업|적성|꿈)/u.test(activity)) return "진로";
  if (available.has("봉") && /(?:봉사|나눔|환경\s*정리)/u.test(activity)) return "봉사";
  if (available.has("자")) return "자율";
  if (available.has("봉")) return "봉사";
  if (available.has("진")) return "진로";
  if (available.has("창체")) return "창체";
  return null;
}

export function parseCreativeTimetableLocally(text: string): CreativeActivityRow[] | null {
  const hasSemesterMarker = /20\d{2}학년도\s*[12]학기/u.test(text);
  const hasWeeklyStructure = text.split(/\r?\n/u).some((line) =>
    LOCAL_WEEK_RANGE_PATTERN.test(line.trim()),
  );
  if (!hasSemesterMarker || (!LOCAL_TIMETABLE_TITLE_PATTERN.test(text) && !hasWeeklyStructure)) {
    return null;
  }

  const year = Number(text.match(/(20\d{2})학년도/u)?.[1]);
  if (!Number.isInteger(year)) return null;
  const lines = text.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
  const rawRows: RawCreativeActivity[] = [];

  for (let index = 0; index < lines.length - 2; index += 1) {
    if (!/^\d{1,3}$/u.test(lines[index])) continue;
    const rangeMatch = lines[index + 1]?.match(LOCAL_WEEK_RANGE_PATTERN);
    const schoolDays = Number(lines[index + 2]);
    if (!rangeMatch || !Number.isInteger(schoolDays) || schoolDays < 1 || schoolDays > 5) continue;

    let nextWeekIndex = lines.length;
    for (let cursor = index + 3; cursor < lines.length - 1; cursor += 1) {
      if (/^\d{1,3}$/u.test(lines[cursor]) && LOCAL_WEEK_RANGE_PATTERN.test(lines[cursor + 1])) {
        nextWeekIndex = cursor;
        break;
      }
    }
    const block = lines.slice(index + 3, nextWeekIndex);
    const firstNoteIndex = block.findIndex((line) => parseLocalNote(line) !== null);
    if (firstNoteIndex < 0) {
      index = nextWeekIndex - 1;
      continue;
    }
    const subjectCodes = block.slice(0, firstNoteIndex).filter((line) => LOCAL_SUBJECT_PATTERN.test(line));
    const notes = block.slice(firstNoteIndex).map(parseLocalNote).filter((note): note is LocalTimetableNote => note !== null);
    let activeWeekdays = weekdaysInRange(year, rangeMatch);
    if (activeWeekdays.length > schoolDays) {
      const holidayWeekdays = new Set(
        notes.filter((note) => LOCAL_HOLIDAY_PATTERN.test(note.activity)).map((note) => note.weekday),
      );
      activeWeekdays = activeWeekdays.filter((weekday) => !holidayWeekdays.has(weekday));
    }
    if (activeWeekdays.length > schoolDays) activeWeekdays = activeWeekdays.slice(0, schoolDays);

    const dayLengths = fitDayLengths(activeWeekdays, subjectCodes.length);
    const daySubjects = new Map<number, string[]>();
    let offset = 0;
    activeWeekdays.forEach((weekday) => {
      const length = dayLengths.get(weekday) ?? 0;
      daySubjects.set(weekday, subjectCodes.slice(offset, offset + length));
      offset += length;
    });

    notes.forEach((note) => {
      const category = creativeCategoryForDay(daySubjects.get(note.weekday) ?? [], note.activity);
      if (!category || LOCAL_HOLIDAY_PATTERN.test(note.activity)) return;
      rawRows.push({
        date: note.date,
        category,
        activity: note.activity,
        hours: 1,
        needsReview: false,
      });
    });
    index = nextWeekIndex - 1;
  }

  const rows = normalizeCreativeActivities(rawRows);
  return rows.length > 0 ? rows : null;
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
  const consonantEndingTerms = ["다양성", "블록 모형"];
  const vowelEndingTerms = ["점토", "블록형 코딩 도구", "영상 자료"];
  const particleBoundary = "(?=$|[^\\p{L}\\p{N}])";
  const consonantCorrections = [
    ["와", "과"],
    ["는", "은"],
    ["로", "으로"],
    ["를", "을"],
    ["가", "이"],
  ] as const;
  const vowelCorrections = [
    ["과", "와"],
    ["은", "는"],
    ["으로", "로"],
    ["을", "를"],
    ["이", "가"],
  ] as const;

  let corrected = value;
  consonantEndingTerms.forEach((term) => {
    consonantCorrections.forEach(([source, replacement]) => {
      corrected = corrected.replace(
        new RegExp(`${term}${source}${particleBoundary}`, "gu"),
        `${term}${replacement}`,
      );
    });
  });
  vowelEndingTerms.forEach((term) => {
    vowelCorrections.forEach(([source, replacement]) => {
      corrected = corrected.replace(
        new RegExp(`${term}${source}${particleBoundary}`, "gu"),
        `${term}${replacement}`,
      );
    });
  });
  return corrected;
}

function convertBieupFormalEnding(value: string) {
  const explicitRieulStemEnding = value
    .replace(/만듭니다$/u, "만듦")
    .replace(/놉니다$/u, "놂");

  return explicitRieulStemEnding.replace(/([\uAC00-\uD7A3])니다$/u, (match, endingSyllable: string) => {
    if (endingSyllable === "습") return match;

    const syllableCode = endingSyllable.charCodeAt(0);
    const jongseongIndex = (syllableCode - 0xac00) % 28;

    return jongseongIndex === 17
      ? String.fromCharCode(syllableCode - 1)
      : match;
  });
}

function naturalizeCreativeEnding(value: string) {
  return value
    .replace(/태도 형성임$/u, "태도를 형성함")
    .replace(/기반을 다지는 활동임$/u, "기반을 다지는 활동에 참여함")
    .replace(/성장 과정임$/u, "태도를 기름")
    .replace(/하는 과정임$/u, "함")
    .replace(/활동임$/u, "활동에 참여함")
    .replace(/태도임$/u, "태도를 가짐");
}

const CREATIVE_COMPLETED_ENDING_SOURCE =
  "(?:다짐함?|참여함|실천함|이해함|형성함|함양함|탐색함|노력함|적용함|숙지함|익힘|기름|깨달음|배움|높임|가짐|앎|느낌|세움|살펴봄|찾아봄|보임|됨|있음|없음)";
const STACKED_CREATIVE_ENDING_PATTERN = new RegExp(
  `(${CREATIVE_COMPLETED_ENDING_SOURCE})을\\s*${CREATIVE_COMPLETED_ENDING_SOURCE}.*$`,
  "u",
);

function collapseMalformedCreativeEnding(value: string) {
  return value
    .replace(STACKED_CREATIVE_ENDING_PATTERN, "$1")
    .replace(/보임함+$/u, "보임")
    .replace(/함(?:함)+$/u, "함");
}

const NATURAL_CREATIVE_ENDING_PATTERN =
  /(?:함|익힘|기름|높임|다짐|가짐|깨달음|배움|앎|느낌|세움|살펴봄|찾아봄|보임|됨|있음|없음)\.$/u;
const MALFORMED_CREATIVE_COMMENT_PATTERN = new RegExp(
  `${CREATIVE_COMPLETED_ENDING_SOURCE}을\\s*${CREATIVE_COMPLETED_ENDING_SOURCE}|보임함|함함|(?:과정|활동|설명|태도|형성)임|[{}\\[\\]]`,
  "u",
);

const CREATIVE_PREDICATE_FAMILIES = [
  /(?:다지(?:고|며|면서|어)|다짐함)/gu,
  /(?:이해(?:하고|하며|하여|함))/gu,
  /(?:설명(?:하고|하며|하여|함))/gu,
  /(?:해결(?:하고|하며|하여|함))/gu,
  /(?:참여(?:하고|하며|하여|함))/gu,
  /(?:실천(?:하고|하며|하여|함))/gu,
  /(?:분석(?:하고|하며|하여|함))/gu,
  /(?:탐색(?:하고|하며|하여|함))/gu,
  /(?:익히(?:고|며|면서|어)|익힘)/gu,
  /(?:기르(?:고|며|면서|어)|기름)/gu,
  /(?:높이(?:고|며|면서|어)|높임)/gu,
  /(?:형성(?:하고|하며|하여|함))/gu,
] as const;

const CREATIVE_OBJECT_PREDICATE_MISMATCH_PATTERN =
  /(?:자기\s*이해|이해|태도|자세)(?:를|을)\s*익힘/u;

function hasRepeatedCreativeModifier(value: string) {
  const modifiers = value.match(/[가-힣]{2,}(?:하게|히|적으로)/gu) ?? [];
  const seen = new Set<string>();
  return modifiers.some((modifier) => {
    if (seen.has(modifier)) return true;
    seen.add(modifier);
    return false;
  });
}

function hasRepeatedCreativePredicate(value: string) {
  return CREATIVE_PREDICATE_FAMILIES.some((pattern) => {
    pattern.lastIndex = 0;
    const matches = value.match(pattern) ?? [];
    return matches.length > 1;
  });
}

function toNounEnding(value: string) {
  return convertBieupFormalEnding(value)
    .replace(/입니다$/u, "임")
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
    .replace(/보였습니다$/u, "보임")
    .replace(/습니다$/u, "음");
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
    .replace(/[{}\[\]<>"'`~@#$%^&*_+=|\\/]+/gu, " ")
    .replace(/[,，]+/gu, ",")
    .replace(/[;；:：]+/gu, ",")
    .replace(/\s+/gu, " ")
    .replace(/\s+,/gu, ",")
    .replace(/,\s*,+/gu, ",")
    .trim();

  sanitized = collapseMalformedCreativeEnding(
    toNounEnding(
      naturalizeCreativeEnding(
        collapseMalformedCreativeEnding(sanitized),
      ),
    ),
  ).trim();
  return sanitized ? `${sanitized}.` : "";
}

export function isNaturalCreativeComment(value: string): boolean {
  const comment = value.trim();
  return comment.length > 0
    && !MALFORMED_CREATIVE_COMMENT_PATTERN.test(comment)
    && !CREATIVE_OBJECT_PREDICATE_MISMATCH_PATTERN.test(comment)
    && !hasRepeatedCreativeModifier(comment)
    && !hasRepeatedCreativePredicate(comment)
    && NATURAL_CREATIVE_ENDING_PATTERN.test(comment);
}
