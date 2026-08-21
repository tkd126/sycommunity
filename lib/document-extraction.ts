import { hwpToText, HwpxReader } from "@ssabrojs/hwpxjs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const EMPTY_DOCUMENT_MESSAGE =
  "문서에서 읽을 수 있는 글자를 찾지 못했습니다. 스캔 또는 보호 문서인지 확인해 주세요.";

export type PdfTextItem = {
  str: string;
  transform: number[];
};

export function applyPdfViewportTransform(
  item: PdfTextItem,
  viewportTransform: number[],
): PdfTextItem {
  const [a1, b1, c1, d1, e1, f1] = viewportTransform;
  const [a2, b2, c2, d2, e2, f2] = item.transform;
  const transformed = [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];

  return {
    str: item.str,
    // groupPdfTextItems는 큰 y 값을 화면 위쪽으로 취급하므로 화면 y축을 뒤집는다.
    transform: [...transformed.slice(0, 5), -transformed[5]],
  };
}

export function groupPdfTextItems(items: PdfTextItem[]): string {
  const sorted = [...items].sort((a, b) => {
    const verticalDifference = b.transform[5] - a.transform[5];
    return Math.abs(verticalDifference) > 2
      ? verticalDifference
      : a.transform[4] - b.transform[4];
  });
  const lines: Array<{ y: number; items: PdfTextItem[] }> = [];

  for (const item of sorted) {
    const y = item.transform[5];
    const currentLine = lines.at(-1);
    if (!currentLine || Math.abs(currentLine.y - y) > 2) {
      lines.push({ y, items: [item] });
    } else {
      currentLine.items.push(item);
    }
  }

  return lines
    .map((line) => line.items
      .sort((a, b) => a.transform[4] - b.transform[4])
      .map((item) => item.str.trim())
      .filter(Boolean)
      .join(" "))
    .filter(Boolean)
    .join("\n");
}

export function extractAreaNameFromPdfItems(items: PdfTextItem[]): string {
  const nameHeader = items.find((item) => item.str.trim() === "성명");
  const areaHeader = items.find((item) => item.str.trim() === "영역");
  const criteriaHeader = items.find((item) => item.str.trim() === "성취기준");
  if (!nameHeader || !areaHeader || !criteriaHeader) return "";

  const left = (nameHeader.transform[4] + areaHeader.transform[4]) / 2;
  const right = (areaHeader.transform[4] + criteriaHeader.transform[4]) / 2;
  const candidates = items
    .filter((item) => item.transform[4] > left && item.transform[4] < right)
    .map((item) => item.str.trim())
    .filter((value) =>
      !["성명", "영역", "성취기준", "평가요소", "단계", "평가결과"].includes(value) &&
      /^[가-힣 ]{1,20}$/.test(value) &&
      /[가-힣]/.test(value),
    );
  const counts = new Map<string, number>();
  for (const value of candidates) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))[0]?.[0] ?? "";
}

function isPdfTextItem(item: unknown): item is PdfTextItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    typeof item.str === "string" &&
    "transform" in item &&
    Array.isArray(item.transform)
  );
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocument({ data: Uint8Array.from(bytes) }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const items = (content.items.filter(isPdfTextItem) as PdfTextItem[])
      .map((item) => applyPdfViewportTransform(item, viewport.transform));
    pages.push(groupPdfTextItems(items));
  }

  return pages.join("\n");
}

export async function extractAchievementPdf(bytes: Uint8Array): Promise<{ text: string; areaName: string }> {
  const pdf = await getDocument({ data: Uint8Array.from(bytes) }).promise;
  const pages: string[] = [];
  const areaNames: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const items = (content.items.filter(isPdfTextItem) as PdfTextItem[])
      .map((item) => applyPdfViewportTransform(item, viewport.transform));
    pages.push(groupPdfTextItems(items));
    const areaName = extractAreaNameFromPdfItems(items);
    if (areaName) areaNames.push(areaName);
  }

  const counts = new Map<string, number>();
  for (const areaName of areaNames) counts.set(areaName, (counts.get(areaName) ?? 0) + 1);
  const areaName = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))[0]?.[0] ?? "";
  return { text: normalizeExtractedText(pages.join("\n")), areaName };
}

async function extractHwpxText(bytes: Uint8Array): Promise<string> {
  const reader = new HwpxReader();
  await reader.loadFromArrayBuffer(Uint8Array.from(bytes).buffer);
  return reader.extractText();
}

function normalizeExtractedText(text: string): string {
  return text
    .replaceAll("\u0000", "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractDocumentText(
  bytes: Uint8Array,
  fileName: string,
): Promise<string> {
  const lowerName = fileName.toLowerCase();
  const supported = [".pdf", ".hwp", ".hwpx"].some((extension) =>
    lowerName.endsWith(extension),
  );

  if (!supported) {
    throw new Error("지원하지 않는 문서 형식입니다. PDF, HWP, HWPX 파일을 사용해 주세요.");
  }
  if (bytes.byteLength === 0) throw new Error(EMPTY_DOCUMENT_MESSAGE);

  try {
    let text = "";
    if (lowerName.endsWith(".pdf")) text = await extractPdfText(bytes);
    else if (lowerName.endsWith(".hwp")) text = await hwpToText(bytes);
    else text = await extractHwpxText(bytes);

    const normalized = normalizeExtractedText(text);
    if (!normalized) throw new Error(EMPTY_DOCUMENT_MESSAGE);
    return normalized;
  } catch (error) {
    if (error instanceof Error && error.message === EMPTY_DOCUMENT_MESSAGE) throw error;
    throw new Error(
      "문서를 읽지 못했습니다. 파일이 손상되었거나 암호로 보호되었는지 확인해 주세요.",
    );
  }
}
