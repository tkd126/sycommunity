"use client";

import { useRef, useState } from "react";

import { UsageBadge } from "@/components/UsageBadge";
import {
  addEmptyRow,
  applyDummyComments,
  createInitialRows,
  getTargetIds,
  removeSelectedRows,
  toClipboardText,
  toCsv,
  type TargetMode,
} from "@/lib/report-ui";
import type { Notice, StudentRow } from "@/types/report";

const SUBJECTS = ["국어", "수학", "사회", "과학", "도덕", "체육", "음악", "미술", "영어", "실과"];
const YEARS = ["2026", "2025", "2024"];
const SEMESTERS = ["1", "2"];
const GRADES = ["1", "2", "3", "4", "5", "6"];
const CLASSROOMS = ["1", "2", "3", "4", "5"];

export function ReportGenerator() {
  const [rows, setRows] = useState<StudentRow[]>(createInitialRows);
  const [year, setYear] = useState("2026");
  const [semester, setSemester] = useState("1");
  const [grade, setGrade] = useState("3");
  const [classroom, setClassroom] = useState("1");
  const [subject, setSubject] = useState("국어");
  const [evaluationPlan, setEvaluationPlan] = useState("");
  const [example, setExample] = useState("");
  const [instruction, setInstruction] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<Notice>({
    type: "info",
    message: "평가 계획과 학생별 평가결과를 확인한 뒤 평어를 생성해 주세요.",
  });
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const planRef = useRef<HTMLTextAreaElement>(null);

  const completedReferenceCount = [evaluationPlan, example, instruction, password].filter((value) => value.trim()).length;
  const allSelected = rows.length > 0 && rows.every((row) => row.selected);

  function updateRow(id: string, patch: Partial<StudentRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function validateAndGenerate(mode: TargetMode) {
    const targetIds = getTargetIds(rows, mode);
    if (targetIds.length === 0) {
      setNotice({ type: "error", message: "생성할 학생을 선택해 주세요." });
      return;
    }

    const targets = rows.filter((row) => targetIds.includes(row.id));
    if (!subject) {
      setNotice({ type: "error", message: "교과를 선택해 주세요." });
      return;
    }
    if (targets.some((row) => !row.name.trim() || !row.evaluation.trim())) {
      setNotice({ type: "error", message: "생성 대상의 성명과 평가결과를 입력해 주세요." });
      return;
    }
    if (!evaluationPlan.trim() && !example.trim()) {
      setNotice({ type: "error", message: "평가 계획 또는 학기말 종합의견 예시를 입력해 주세요." });
      detailsRef.current?.setAttribute("open", "");
      return;
    }
    if (!password.trim()) {
      setNotice({ type: "error", message: "교사 접근 비밀번호를 입력해 주세요." });
      detailsRef.current?.setAttribute("open", "");
      return;
    }

    setRows((current) => applyDummyComments(current, targetIds, subject));
    setNotice({ type: "success", message: `${targets.length}명의 ${subject} 학기말 종합의견을 더미 데이터로 생성했습니다.` });
  }

  function openReferenceInputs() {
    detailsRef.current?.setAttribute("open", "");
    window.requestAnimationFrame(() => planRef.current?.focus());
  }

  async function copyResults() {
    try {
      await navigator.clipboard.writeText(toClipboardText(rows));
      setNotice({ type: "success", message: "현재 표 내용을 클립보드에 복사했습니다." });
    } catch {
      setNotice({ type: "error", message: "클립보드 복사에 실패했습니다. 브라우저 권한을 확인해 주세요." });
    }
  }

  function downloadCsv() {
    try {
      const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "교과평어.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice({ type: "success", message: "교과평어.csv 파일을 만들었습니다." });
    } catch {
      setNotice({ type: "error", message: "CSV 파일을 만드는 중 오류가 발생했습니다." });
    }
  }

  function deleteSelected() {
    if (!rows.some((row) => row.selected)) {
      setNotice({ type: "error", message: "삭제할 학생을 선택해 주세요." });
      return;
    }
    setRows((current) => removeSelectedRows(current));
    setNotice({ type: "success", message: "선택한 학생 행을 삭제했습니다." });
  }

  function resetAll() {
    if (!window.confirm("입력한 내용과 생성 결과를 모두 초기화할까요?")) return;
    setRows(createInitialRows());
    setEvaluationPlan("");
    setExample("");
    setInstruction("");
    setPassword("");
    setNotice({ type: "info", message: "입력 내용을 초기 상태로 되돌렸습니다." });
  }

  return (
    <div className="report-page">
      <div className="page-heading">
        <div>
          <div className="breadcrumb"><span>평가관리</span><i>/</i><b>학기말종합의견</b></div>
          <h1>학기말종합의견</h1>
          <p>수행평가 결과를 바탕으로 교과별 종합의견을 작성하고 편집할 수 있습니다.</p>
        </div>
        <UsageBadge amountKrw={18420} budgetKrw={30000} />
      </div>

      <section className="query-panel" aria-labelledby="query-title">
        <div className="section-label" id="query-title">조회 조건</div>
        <div className="query-grid">
          <LabeledSelect label="학년도" value={year} onChange={setYear} options={YEARS} suffix="학년도" />
          <LabeledSelect label="학기" value={semester} onChange={setSemester} options={SEMESTERS} suffix="학기" />
          <LabeledSelect label="학년" value={grade} onChange={setGrade} options={GRADES} suffix="학년" />
          <LabeledSelect label="반" value={classroom} onChange={setClassroom} options={CLASSROOMS} suffix="반" />
          <LabeledSelect label="교과" value={subject} onChange={setSubject} options={SUBJECTS} />
          <button type="button" className="button-primary query-button" onClick={() => setNotice({ type: "info", message: `${year}학년도 ${semester}학기 ${grade}학년 ${classroom}반 ${subject} 자료를 표시합니다.` })}>조회</button>
        </div>
      </section>

      <details className="reference-panel" ref={detailsRef} open>
        <summary>
          <span className="summary-icon" aria-hidden="true">＋</span>
          <span><b>생성 참고자료 및 접근 설정</b><small>평가 계획과 예시문을 입력하면 더 자연스러운 평어를 만들 수 있습니다.</small></span>
          <em>{completedReferenceCount} / 4 입력</em>
        </summary>
        <div className="reference-content">
          <label>
            <span>평가 계획 <b>필수 권장</b></span>
            <textarea ref={planRef} className="textarea" aria-label="평가 계획" value={evaluationPlan} onChange={(event) => setEvaluationPlan(event.target.value)} placeholder="성취기준과 평가 요소를 붙여 넣어 주세요." rows={4} />
          </label>
          <label>
            <span>학기말 종합의견 예시</span>
            <textarea className="textarea" aria-label="학기말 종합의견 예시" value={example} onChange={(event) => setExample(event.target.value)} placeholder="원하는 문체의 예시문을 입력해 주세요." rows={4} />
          </label>
          <label>
            <span>추가 지시사항</span>
            <textarea className="textarea" aria-label="추가 지시사항" value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="문장 길이와 강조할 내용을 입력해 주세요." rows={4} />
          </label>
          <label>
            <span>교사 접근 비밀번호 <b>필수</b></span>
            <input className="field" type="password" aria-label="교사 접근 비밀번호" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호를 입력해 주세요." autoComplete="current-password" />
            <small>1단계에서는 입력 여부만 확인하며 저장하지 않습니다.</small>
          </label>
        </div>
      </details>

      <div className={`notice notice--${notice?.type ?? "info"}`} role="status" aria-live="polite">
        <span aria-hidden="true">{notice?.type === "error" ? "!" : notice?.type === "success" ? "✓" : "i"}</span>
        {notice?.message}
      </div>

      <section className="table-panel" aria-labelledby="student-table-title">
        <div className="table-toolbar">
          <div>
            <h2 id="student-table-title">학생별 평가결과 및 종합의견</h2>
            <span>Total {rows.length}</span>
          </div>
          <div className="toolbar-buttons toolbar-buttons--primary">
            <button type="button" className="button-primary" onClick={() => validateAndGenerate("smart")}>교과평어 생성</button>
            <button type="button" className="button-secondary" onClick={() => validateAndGenerate("selected")}>선택 학생만 생성</button>
            <button type="button" className="button-secondary" onClick={() => validateAndGenerate("all")}>전체 학생 생성</button>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-buttons">
            <button type="button" className="button-secondary" onClick={copyResults}>결과 복사</button>
            <button type="button" className="button-secondary" onClick={downloadCsv}>CSV 다운로드</button>
            <button type="button" className="button-secondary" onClick={() => { setRows((current) => addEmptyRow(current)); setNotice({ type: "info", message: "빈 학생 행을 추가했습니다." }); }}>행 추가</button>
            <button type="button" className="button-secondary button-danger" onClick={deleteSelected}>선택 삭제</button>
            <button type="button" className="button-quiet" onClick={resetAll}>초기화</button>
          </div>
        </div>

        <div className="table-scroll">
          <table className="student-table">
            <thead>
              <tr>
                <th className="col-check"><input type="checkbox" aria-label="전체 학생 선택" checked={allSelected} onChange={(event) => setRows((current) => current.map((row) => ({ ...row, selected: event.target.checked })))} /></th>
                <th className="col-number">번호</th><th className="col-name">성명</th><th className="col-reference">참고자료</th><th className="col-evaluation">평가결과</th><th className="col-comment">학기말 종합의견</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} aria-label={`${row.number}번 학생 행`}>
                  <td className="col-check"><input type="checkbox" aria-label={`${row.name || `${row.number}번 학생`} 선택`} checked={row.selected} onChange={(event) => updateRow(row.id, { selected: event.target.checked })} /></td>
                  <td><input className="table-input table-input--number" type="number" aria-label={`${row.number}번 번호`} value={row.number} onChange={(event) => updateRow(row.id, { number: Number(event.target.value) })} /></td>
                  <td><input className="table-input" aria-label={`${row.number}번 성명`} value={row.name} onChange={(event) => updateRow(row.id, { name: event.target.value })} placeholder="성명" /></td>
                  <td><button type="button" className="reference-button" onClick={openReferenceInputs}><span aria-hidden="true">＋</span> 자료 입력</button></td>
                  <td><textarea className="table-textarea table-textarea--evaluation" aria-label={`${row.name || `${row.number}번 학생`} 평가결과`} value={row.evaluation} onChange={(event) => updateRow(row.id, { evaluation: event.target.value })} placeholder="영역별 성취 수준을 입력해 주세요." rows={3} /></td>
                  <td><textarea className="table-textarea table-textarea--comment" aria-label={`${row.name || `${row.number}번 학생`} 학기말 종합의견`} value={row.comment} onChange={(event) => updateRow(row.id, { comment: event.target.value })} placeholder="생성된 종합의견이 표시됩니다. 직접 수정할 수 있습니다." rows={3} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footnote"><span aria-hidden="true">ⓘ</span> 현재 화면은 더미 생성 단계입니다. 입력한 학생 정보와 결과는 서버나 데이터베이스에 저장되지 않습니다.</div>
      </section>
    </div>
  );
}

function LabeledSelect({ label, value, onChange, options, suffix = "" }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[]; suffix?: string }) {
  return (
    <label className="query-field">
      <span>{label}</span>
      <select className="field" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}{suffix}</option>)}
      </select>
    </label>
  );
}
