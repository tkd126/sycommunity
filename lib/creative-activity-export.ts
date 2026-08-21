import { htmlToHwpx } from "@ssabrojs/hwpxjs";
import JSZip from "jszip";

import type { CreativeActivityRow } from "@/types/creative-activity";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function topicFor(row: CreativeActivityRow) {
  const prefix = row.category === "진로" || row.category === "봉사"
    ? `(${row.category}) `
    : "";
  return `${prefix}${row.activity.trim()}`;
}

function normalizeHwpxAttributes(xml: string) {
  return xml.replace(
    /(\s)(?!xmlns:)(?:ha|hp|hh|hs|hc|hpf):([A-Za-z_][\w.-]*)=/gu,
    "$1$2=",
  );
}

function sectionProperties() {
  return [
    '<hp:p id="1" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">',
    '<hp:run charPrIDRef="0">',
    '<hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" tabStop="8000" tabStopVal="4000" tabStopUnit="HWPUNIT" outlineShapeIDRef="1" memoShapeIDRef="1" textVerticalWidthHead="0" masterPageCnt="0">',
    '<hp:grid lineGrid="0" charGrid="0" wonggojiFormat="0"/>',
    '<hp:startNum pageStartsOn="BOTH" page="0" pic="0" tbl="0" equation="0"/>',
    '<hp:pagePr landscape="WIDELY" width="59528" height="84186" gutterType="LEFT_ONLY">',
    '<hp:margin header="2835" footer="2835" gutter="0" left="2835" right="2835" top="1417" bottom="1417"/>',
    "</hp:pagePr>",
    "</hp:secPr>",
    "</hp:run>",
    "</hp:p>",
  ].join("");
}

function docxParagraph(value: string, bold = false) {
  const properties = bold ? "<w:rPr><w:b/></w:rPr>" : "";
  return `<w:p><w:r>${properties}<w:t xml:space="preserve">${escapeHtml(value)}</w:t></w:r></w:p>`;
}

function docxCell(value: string, width: number, bold = false) {
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/></w:tcPr>${docxParagraph(value, bold)}</w:tc>`;
}

export async function createCreativeActivityDocx(
  rows: CreativeActivityRow[],
  semester: "1" | "2",
) {
  const resultRows = rows.filter((row) => row.comment.trim());
  if (resultRows.length === 0) {
    throw new Error("내려받을 창체 평어가 없습니다.");
  }

  const tableRows = [
    `<w:tr>${docxCell("주", 600, true)}${docxCell("날짜", 900, true)}${docxCell("시수", 700, true)}${docxCell("학습 주제", 2400, true)}${docxCell("세부 사항 기록", 6500, true)}</w:tr>`,
    ...resultRows.map((row) => `<w:tr>${docxCell("", 600)}${docxCell(row.date, 900)}${docxCell(String(row.hours), 700)}${docxCell(topicFor(row), 2400)}${docxCell(row.comment.trim(), 6500)}</w:tr>`),
  ].join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${docxParagraph(`${semester}학기 창의적 체험활동`, true)}
    <w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>${tableRows}</w:tbl>
    <w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>
  </w:body>
</w:document>`;

  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.folder("_rels")!.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.folder("word")!.file("document.xml", documentXml);

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export async function createCreativeActivityHwpx(
  rows: CreativeActivityRow[],
  semester: "1" | "2",
) {
  const resultRows = rows.filter((row) => row.comment.trim());
  if (resultRows.length === 0) {
    throw new Error("내려받을 창체 평어가 없습니다.");
  }

  const bodyRows = resultRows.map((row) => `
    <tr>
      <td></td>
      <td><strong>${escapeHtml(row.date)}</strong></td>
      <td>${row.hours}</td>
      <td>${escapeHtml(topicFor(row))}</td>
      <td>${escapeHtml(row.comment.trim())}</td>
    </tr>`).join("");
  const title = `${semester}학기 창의적 체험활동`;
  const html = `
    <table>
      <thead>
        <tr><th>주</th><th>날짜</th><th>시수</th><th>학습 주제</th><th>세부 사항 기록</th></tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>`;

  const source = await htmlToHwpx(html, {
    title,
    creator: "생기부 도우미",
  });
  const zip = await JSZip.loadAsync(source);
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  zip.file(
    "version.xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?><hv:HCFVersion xmlns:hv="http://www.hancom.co.kr/hwpml/2011/version" targetApplication="WORDPROCESSOR" major="5" minor="1" micro="1" buildNumber="0" os="1" xmlVersion="1.5" application="Hancom Office Hangul"/>',
  );

  const xmlPaths = [
    "settings.xml",
    "Contents/content.hpf",
    "Contents/header.xml",
    "Contents/section0.xml",
    "META-INF/container.xml",
    "META-INF/manifest.xml",
  ];
  for (const path of xmlPaths) {
    const file = zip.file(path);
    if (!file) continue;
    let xml = normalizeHwpxAttributes(await file.async("string"));
    if (path === "Contents/section0.xml" && !xml.includes("<hp:secPr")) {
      xml = xml.replace(/(<hs:sec\b[^>]*>)/u, `$1${sectionProperties()}`);
    }
    zip.file(path, xml);
  }

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    platform: "DOS",
  });
}
