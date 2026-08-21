"use client";

import { useMemo, useRef, useState } from "react";

import { FileDropzone } from "@/components/FileDropzone";
import { HeaderSelectionCheckbox } from "@/components/HeaderSelectionCheckbox";
import {
  createCreativeActivityDocx,
  createCreativeActivityHwpx,
} from "@/lib/creative-activity-export";
import { chooseSpecificCreativeActivity } from "@/lib/creative-activity";
import { proofreadInBatches } from "@/lib/proofread-client";
import {
  CREATIVE_CATEGORIES,
  MAX_CREATIVE_GENERATION_ROWS,
  type CreativeActivityRow,
  type CreativeCategory,
} from "@/types/creative-activity";

type Notice = { kind: "info" | "success" | "error"; message: string } | null;
type BusyState = "parse" | "generate" | "proofread" | "export" | null;

const SUPPORTED_FILE_PATTERN = /\.(hwp|hwpx|pdf)$/i;

function isValidDate(value: string) {
  const match = value.match(/^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])$/);
  if (!match) return false;
  const month = Number(match[1]);
  const day = Number(match[2]);
  return day <= new Date(2000, month, 0).getDate();
}

function rowProblems(row: CreativeActivityRow) {
  const problems: string[] = [];
  if (!isValidDate(row.date)) problems.push("날짜는 실제 달력의 M/D 형식으로 입력해 주세요.");
  if (!Number.isInteger(row.hours) || row.hours < 1 || row.hours > 8) problems.push("시수는 1~8 사이의 정수로 입력해 주세요.");
  if (!CREATIVE_CATEGORIES.includes(row.category)) problems.push("구분을 확인해 주세요.");
  if (!row.activity.trim()) problems.push("활동 내용을 입력해 주세요.");
  return problems;
}

function csvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function responseMessage(response: Response, fallback: string) {
  try {
    const data = await response.json() as { message?: unknown };
    return typeof data.message === "string" && data.message.trim() ? data.message : fallback;
  } catch {
    return fallback;
  }
}

function ResultCommentEditor({
  value,
  label,
  onCommit,
}: {
  value: string;
  label: string;
  onCommit: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onCommit(event.target.value)}
      placeholder="평어를 생성하면 이곳에 표시됩니다."
      aria-label={label}
    />
  );
}

export function CreativeActivityGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<CreativeActivityRow[]>([]);
  const [semester, setSemester] = useState<"1" | "2">("1");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<BusyState>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [proofreadBackup, setProofreadBackup] = useState<Map<string, string> | null>(null);
  const manualRowSequence = useRef(0);

  const resultRows = useMemo(() => rows.filter((row) => row.comment.trim()), [rows]);
  const selectedRowCount = useMemo(() => rows.filter((row) => row.selected).length, [rows]);

  function acceptFiles(files: File[]) {
    const nextFile = files[0];
    if (!nextFile) return;
    if (!SUPPORTED_FILE_PATTERN.test(nextFile.name)) {
      setNotice({ kind: "error", message: "HWP, HWPX, PDF 파일만 사용할 수 있습니다." });
      return;
    }
    setFile(nextFile);
    setNotice(null);
  }

  function updateRow(id: string, patch: Partial<CreativeActivityRow>, requiresReview = false) {
    setRows((current) => current.map((row) => (
      row.id === id ? { ...row, ...patch, ...(requiresReview ? { needsReview: true } : {}) } : row
    )));
  }

  async function analyze() {
    if (!file) {
      setNotice({ kind: "error", message: "분석할 연간시간표 파일을 선택해 주세요." });
      return;
    }
    if (!password) {
      setNotice({ kind: "error", message: "교사 접근 비밀번호를 입력해 주세요." });
      return;
    }

    setBusy("parse");
    setNotice({ kind: "info", message: "시간표를 분석하고 있습니다." });
    const form = new FormData();
    form.append("file", file);
    form.append("password", password);
    form.append("semester", semester);
    try {
      const response = await fetch("/api/creative-activities/parse", { method: "POST", body: form });
      if (!response.ok) {
        setNotice({ kind: "error", message: await responseMessage(response, "시간표를 분석하지 못했습니다.") });
        return;
      }
      const data = await response.json() as { activities?: CreativeActivityRow[]; warnings?: string[] };
      const activities = Array.isArray(data.activities) ? data.activities : [];
      setRows(activities);
      setNotice({
        kind: "success",
        message: data.warnings?.length
          ? `시간표를 분석했습니다. ${data.warnings.join(" ")}`
          : "시간표를 분석했습니다. 활동 내용을 검토해 주세요.",
      });
    } catch {
      setNotice({ kind: "error", message: "시간표를 분석하지 못했습니다." });
    } finally {
      setBusy(null);
    }
  }

  function addRow() {
    manualRowSequence.current += 1;
    setRows((current) => [
      ...current,
      {
        id: `manual-${Date.now()}-${manualRowSequence.current}`,
        selected: true,
        date: "",
        category: "자율",
        activity: "",
        hours: 1,
        needsReview: true,
        comment: "",
      },
    ]);
    setNotice({ kind: "info", message: "새 활동 행을 추가했습니다. 내용을 입력하고 확인해 주세요." });
  }

  function deleteSelected() {
    setRows((current) => current.filter((row) => !row.selected));
    setNotice(null);
  }

  function setAllSelected(selected: boolean) {
    setRows((current) => current.map((row) => ({ ...row, selected })));
  }

  function reset() {
    setFile(null);
    setRows([]);
    setPassword("");
    setSemester("1");
    setBusy(null);
    setProofreadBackup(null);
    setNotice(null);
  }

  async function generate(mode: "all" | "selected") {
    const targets = mode === "all" ? rows : rows.filter((row) => row.selected);
    if (targets.length === 0) {
      setNotice({ kind: "error", message: mode === "all" ? "생성할 활동이 없습니다." : "생성할 활동을 선택해 주세요." });
      return;
    }
    const invalidRows = targets.map(rowProblems).filter((problems) => problems.length > 0);
    if (invalidRows.length > 0) {
      setNotice({ kind: "error", message: invalidRows[0].join(" ") });
      return;
    }
    if (!password) {
      setNotice({ kind: "error", message: "교사 접근 비밀번호를 입력해 주세요." });
      return;
    }

    const requestRows = targets.map(({ id, date, category, activity, hours }) => ({
      id,
      date,
      category,
      activity: chooseSpecificCreativeActivity(activity),
      hours,
    }));
    setProofreadBackup(null);
    setBusy("generate");
    setNotice({ kind: "info", message: `평어 생성 중 0/${targets.length}개 (0%)` });
    try {
      const requestedIds = new Set(targets.map((row) => row.id));
      const comments = new Map<string, string>();
      let completed = 0;

      for (let offset = 0; offset < requestRows.length; offset += MAX_CREATIVE_GENERATION_ROWS) {
        const batch = requestRows.slice(offset, offset + MAX_CREATIVE_GENERATION_ROWS);
        const response = await fetch("/api/creative-activities/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ password, rows: batch }),
        });
        if (!response.ok) {
          setNotice({ kind: "error", message: await responseMessage(response, "평어를 생성하지 못했습니다.") });
          return;
        }

        const data = await response.json() as { rows?: Array<{ id: string; comment: string }> };
        const batchIds = new Set(batch.map((row) => row.id));
        const returnedRows = Array.isArray(data.rows) ? data.rows : [];
        returnedRows
          .filter((row) => batchIds.has(row.id) && requestedIds.has(row.id) && typeof row.comment === "string")
          .forEach((row) => comments.set(row.id, row.comment));

        completed += batch.length;
        const percent = Math.round((completed / targets.length) * 100);
        setNotice({ kind: "info", message: `평어 생성 중 ${completed}/${targets.length}개 (${percent}%)` });
      }
      if (targets.some((row) => !comments.has(row.id))) {
        setNotice({ kind: "error", message: "일부 활동의 평어가 누락되어 결과를 적용하지 않았습니다." });
        return;
      }
      setRows((current) => current.map((row) => (
        comments.has(row.id) ? { ...row, comment: comments.get(row.id) ?? row.comment } : row
      )));
      setNotice({ kind: "success", message: `${targets.length}개 활동의 평어를 생성했습니다.` });
    } catch {
      setNotice({ kind: "error", message: "평어를 생성하지 못했습니다." });
    } finally {
      setBusy(null);
    }
  }

  async function proofreadResults() {
    const targets = resultRows.map((row) => ({ id: row.id, comment: row.comment }));
    if (targets.length === 0) {
      setNotice({ kind: "error", message: "맞춤법을 검사할 창체 평어가 없습니다." });
      return;
    }
    if (!password) {
      setNotice({ kind: "error", message: "교사 접근 비밀번호를 입력해 주세요." });
      return;
    }
    setBusy("proofread");
    setNotice({ kind: "info", message: `맞춤법 검사 중 0/${targets.length}개 (0%)` });
    try {
      const corrected = await proofreadInBatches({
        password,
        rows: targets,
        onProgress: (completed, total) => setNotice({ kind: "info", message: `맞춤법 검사 중 ${completed}/${total}개 (${Math.round(completed / total * 100)}%)` }),
      });
      const correctedById = new Map(corrected.map((row) => [row.id, row.comment]));
      setProofreadBackup(new Map(targets.map((row) => [row.id, row.comment])));
      setRows((current) => current.map((row) => correctedById.has(row.id) ? { ...row, comment: correctedById.get(row.id) ?? row.comment } : row));
      setNotice({ kind: "success", message: `${targets.length}개 창체 평어의 맞춤법 검사를 완료했습니다.` });
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "맞춤법 검사에 실패했습니다." });
    } finally {
      setBusy(null);
    }
  }

  function restoreBeforeProofread() {
    if (!proofreadBackup) return;
    setRows((current) => current.map((row) => proofreadBackup.has(row.id) ? { ...row, comment: proofreadBackup.get(row.id) ?? row.comment } : row));
    setProofreadBackup(null);
    setNotice({ kind: "success", message: "맞춤법 검사 전 결과로 되돌렸습니다." });
  }
  async function copyResults() {
    const text = ["날짜\t평어", ...resultRows.map((row) => `${row.date}\t${row.comment}`)].join("\n");
    await navigator.clipboard?.writeText(text);
    setNotice({ kind: "success", message: "평어 결과를 복사했습니다." });
  }

  function downloadCsv() {
    const csv = [
      "날짜,평어",
      ...resultRows.map((row) => [row.date, row.comment].map(csvValue).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "창의적체험활동-평어.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice({ kind: "success", message: "CSV 파일을 내려받았습니다." });
  }

  async function downloadHwpx() {
    if (resultRows.length === 0) {
      setNotice({ kind: "error", message: "내려받을 창체 평어가 없습니다." });
      return;
    }
    setBusy("export");
    setNotice({ kind: "info", message: "한글 HWPX 파일을 만들고 있습니다." });
    try {
      const bytes = await createCreativeActivityHwpx(resultRows, semester);
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/vnd.hancom.hwpx" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.style.display = "none";
      anchor.href = url;
      anchor.download = "창의적체험활동-평어.hwpx";
      document.body.append(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
      setNotice({ kind: "success", message: "한글 HWPX 파일을 내려받았습니다. 다운로드 폴더에서 한컴오피스 한글로 열어주세요." });
    } catch {
      setNotice({ kind: "error", message: "한글 HWPX 파일을 만들지 못했습니다." });
    } finally {
      setBusy(null);
    }
  }

  async function downloadDocx() {
    if (resultRows.length === 0) {
      setNotice({ kind: "error", message: "내려받을 창체 평어가 없습니다." });
      return;
    }
    setBusy("export");
    setNotice({ kind: "info", message: "호환용 DOCX 파일을 만들고 있습니다." });
    try {
      const bytes = await createCreativeActivityDocx(resultRows, semester);
      const blob = new Blob([new Uint8Array(bytes)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.style.display = "none";
      anchor.href = url;
      anchor.download = "창의적체험활동-평어.docx";
      document.body.append(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
      setNotice({ kind: "success", message: "호환용 DOCX 파일을 내려받았습니다. 한컴오피스 한글에서도 열 수 있습니다." });
    } catch {
      setNotice({ kind: "error", message: "DOCX 파일을 만들지 못했습니다." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="report-page creative-page">
      <div className="page-heading">
        <div>
          <div className="breadcrumb"><span>창의적 체험활동</span><i>/</i><b>시간표 분석과 평어 생성</b></div>
          <h1>창체 시간표 분석·평어</h1>
          <p>연간시간표에서 창체 활동을 찾아 내용을 확인하고 평어를 생성합니다.</p>
        </div>
      </div>

      <div className="privacy-notice">
        <b>개인정보 및 처리 안내</b>
        <p>HWP, HWPX, PDF 파일은 현재 요청을 처리하는 데만 사용하며, 원본 파일과 전체 추출 텍스트는 데이터베이스나 브라우저 저장소에 저장하지 않습니다. 분석 결과를 확인한 뒤 평어를 생성해 주세요.</p>
      </div>

      <section className="creative-upload-panel">
        <FileDropzone
          label="연간시간표"
          accept=".hwp,.hwpx,.pdf"
          files={file ? [file] : []}
          onFiles={acceptFiles}
          onRemove={() => { setFile(null); setNotice(null); }}
        />
        <div className="creative-access-controls" aria-label="시간표 분석 설정">
          <div className="creative-access-heading">
            <b>분석 설정</b>
            <small>학기와 교사 비밀번호를 확인한 뒤 분석해 주세요.</small>
          </div>
          <div className="creative-access-grid">
            <label className="creative-semester-control">
              <span>분석 학기</span>
              <select value={semester} onChange={(event) => setSemester(event.target.value as "1" | "2")} aria-label="분석 학기">
                <option value="1">1학기</option>
                <option value="2">2학기</option>
              </select>
            </label>
            <label>
              <span>교사 접근 비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                aria-label="교사 접근 비밀번호"
              />
            </label>
            <button type="button" className="button-primary creative-analyze-button" disabled={busy !== null} onClick={analyze}>
              {busy === "parse" ? "분석 중…" : "시간표 분석"}
            </button>
            <button type="button" className="button-quiet" disabled={busy !== null} onClick={reset}>초기화</button>
          </div>
        </div>
      </section>

      {notice ? (
        <div className={`notice${notice.kind === "error" ? " notice--error" : notice.kind === "success" ? " notice--success" : ""}`} role={notice.kind === "error" ? "alert" : "status"}>
          <span aria-hidden="true">{notice.kind === "error" ? "!" : notice.kind === "success" ? "✓" : "i"}</span>
          {notice.message}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <section className="table-panel creative-review-panel">
          <div className="table-toolbar">
            <div><h2>추출 활동 및 평어</h2><span>Total {rows.length}</span></div>
            <div className="toolbar-workflow">
              <div className="toolbar-action-group toolbar-action-group--generation" role="group" aria-label="평어 생성">
                <span className="toolbar-action-group__label">평어 생성</span>
                <button type="button" className="button-primary toolbar-main-action" disabled={busy !== null} onClick={() => generate("all")}>
                  {busy === "generate" ? "생성 중…" : "전체 평어 생성"}
                </button>
                <button type="button" className="button-secondary" disabled={busy !== null} onClick={() => generate("selected")}>선택 항목 생성</button>
              </div>
              <div className="toolbar-action-group toolbar-action-group--results" role="group" aria-label="결과 관리">
                <span className="toolbar-action-group__label">결과 관리</span>
                <button type="button" className="button-secondary" disabled={busy !== null || resultRows.length === 0} onClick={proofreadResults}>{busy === "proofread" ? "맞춤법 검사 중…" : "전체 결과 맞춤법 검사"}</button>
                {proofreadBackup ? <button type="button" className="button-secondary" disabled={busy !== null} onClick={restoreBeforeProofread}>검사 전으로 되돌리기</button> : null}
                <button type="button" className="button-secondary" disabled={busy !== null || resultRows.length === 0} onClick={copyResults}>결과 복사</button>
                <button type="button" className="button-secondary" disabled={busy !== null || resultRows.length === 0} onClick={downloadCsv}>CSV 다운로드</button>
                <button type="button" className="button-secondary" disabled={busy !== null || resultRows.length === 0} onClick={downloadHwpx}>
                  {busy === "export" ? "한글 파일 생성 중…" : "한글 파일 다운로드"}
                </button>
                <button type="button" className="button-secondary" disabled={busy !== null || resultRows.length === 0} onClick={downloadDocx}>호환용 DOCX 다운로드</button>
                <button type="button" className="button-secondary" disabled={busy !== null} onClick={addRow}>행 추가</button>
                <button type="button" className="button-quiet button-danger" disabled={busy !== null} onClick={deleteSelected}>선택 삭제</button>
              </div>
            </div>
          </div>
          <div className="table-scroll">
            <table className="creative-review-table" aria-label="창체 활동 및 평어">
              <thead><tr><th><HeaderSelectionCheckbox selectedCount={selectedRowCount} totalCount={rows.length} disabled={busy !== null} label="창체 전체 활동 선택" onChange={setAllSelected} /></th><th>날짜</th><th>시수</th><th>구분</th><th>추출한 활동</th><th>평어</th></tr></thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td><input type="checkbox" checked={row.selected} onChange={(event) => updateRow(row.id, { selected: event.target.checked })} aria-label={`${index + 1}행 선택`} /></td>
                    <td><input className="table-input" value={row.date} onChange={(event) => updateRow(row.id, { date: event.target.value }, true)} aria-label={`${index + 1}행 날짜`} /></td>
                    <td><input className="table-input" type="number" min="1" max="8" step="1" value={row.hours} onChange={(event) => updateRow(row.id, { hours: Number(event.target.value) }, true)} aria-label={`${index + 1}행 시수`} /></td>
                    <td>
                      <select value={row.category} onChange={(event) => updateRow(row.id, { category: event.target.value as CreativeCategory }, true)} aria-label={`${index + 1}행 구분`}>
                        {CREATIVE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                      </select>
                    </td>
                    <td><textarea className="table-textarea" value={row.activity} onChange={(event) => updateRow(row.id, { activity: event.target.value, comment: "" })} aria-label={`${index + 1}행 활동`} /></td>
                    <td className="creative-comment-cell">
                      <ResultCommentEditor value={row.comment} label={`${index + 1}행 평어`} onCommit={(comment) => updateRow(row.id, { comment })} />
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footnote"><span aria-hidden="true">※</span>날짜·시수·구분·활동 내용은 생성할 때 자동으로 확인합니다.</div>
        </section>
      ) : null}
    </section>
  );
}
