"use client";

import { useEffect, useState } from "react";

import { FileDropzone } from "@/components/FileDropzone";
import { UsageBadge } from "@/components/UsageBadge";
import { selectBalancedAreas } from "@/lib/area-selection";
import { getTargetIds, isAllowedDocument, isPdfFile, toClipboardText, toCsv, type TargetMode } from "@/lib/report-ui";
import { readSessionValue, removeSessionValue, writeSessionValue } from "@/lib/session-storage";
import { ACHIEVEMENT_LEVELS, type AchievementLevel, type DocumentAnalysisResponse, type SharedEvaluationPlan } from "@/types/documents";
import type { Notice, StudentRow } from "@/types/report";

const SUBJECTS = ["국어", "수학", "사회", "과학", "영어", "음악", "미술", "체육", "실과", "도덕"] as const;
type Subject = (typeof SUBJECTS)[number];

const SHARED_EVALUATION_PLAN_SESSION_KEY = "student-record-helper:evaluation-plan:v1";
const SHARED_EVALUATION_PLAN_SESSION_VERSION = 1;

function isSharedEvaluationPlan(value: unknown): value is SharedEvaluationPlan {
  return typeof value === "object"
    && value !== null
    && "fileName" in value
    && typeof value.fileName === "string"
    && "extractedText" in value
    && typeof value.extractedText === "string"
    && "analyzedAt" in value
    && typeof value.analyzedAt === "string";
}

const EXAMPLE_PRESETS = [
  { id: "positive", label: "긍정 강조형", text: "학습 내용을 정확히 이해하고 자신의 강점을 살려 활동에 적극적으로 참여함." },
  { id: "growth", label: "성장 중심형", text: "기초를 다지며 배운 내용을 꾸준히 익혀 가고 점차 향상되는 모습을 보임." },
  { id: "collaboration", label: "협력 중심형", text: "서로의 의견을 존중하고 맡은 역할에 책임감 있게 참여하며 함께 해결함." },
  { id: "inquiry", label: "탐구 중심형", text: "학습 주제에 호기심을 가지고 다양한 방법으로 탐색하며 생각을 확장함." },
  { id: "diligence", label: "성실 참여형", text: "수업 활동에 꾸준하고 성실하게 참여하며 배운 내용을 차분히 정리함." },
  { id: "concise", label: "간결형", text: "핵심 내용을 이해하고 자신의 생각을 분명하게 표현하며 활동에 성실히 참여함." },
  { id: "specific", label: "구체적 서술형", text: "자료에서 필요한 정보를 찾아 기준에 따라 정리하고 알맞은 근거를 들어 설명함." },
] as const;

type SubjectWorkspace = {
  worksheets: File[];
  resultFiles: File[];
  areaCount: number;
  analysis: DocumentAnalysisResponse | null;
  rows: StudentRow[];
};

type SavedReportSummary = {
  id: string;
  title: string;
  subject: string;
  schoolYear: string | null;
  semester: string | null;
  grade: string | null;
  className: string | null;
  createdAt: string;
  updatedAt: string;
};

type SavedReportDetails = SavedReportSummary & {
  rows: Array<{
    id: string;
    studentNumber: number;
    anonymousName: string;
    subject: string;
    areaLevels: Array<{ areaName: string; level: string }>;
    selectedAreas: string[];
    comment: string;
  }>;
};

function defaultAreaCount(subject: Subject) {
  return ["국어", "수학", "사회", "과학"].includes(subject) ? 3 : 2;
}

function createWorkspaces(): Record<Subject, SubjectWorkspace> {
  return SUBJECTS.reduce((result, subject) => {
    result[subject] = { worksheets: [], resultFiles: [], areaCount: defaultAreaCount(subject), analysis: null, rows: [] };
    return result;
  }, {} as Record<Subject, SubjectWorkspace>);
}

function buildRows(subject: Subject, analysis: DocumentAnalysisResponse, areaCount: number, previous: StudentRow[]) {
  const students = analysis.roster.map(({ studentNumber }) => ({
    studentNumber,
    levels: analysis.areas.flatMap((area) => {
      const student = area.students.find((item) => item.studentNumber === studentNumber);
      return area.areaName ? [{ areaName: area.areaName, level: student?.level ?? "" }] : [];
    }),
  }));
  const selected = selectBalancedAreas(students, areaCount);
  const previousByNumber = new Map(previous.map((row) => [row.number, row]));

  return selected.map(({ studentNumber, selected: selectedLevels }) => {
    const old = previousByNumber.get(studentNumber);
    return {
      id: old?.id ?? `${subject}-${studentNumber}`,
      selected: old?.selected ?? false,
      number: studentNumber,
      name: `${studentNumber}번 학생`,
      reference: "",
      evaluation: selectedLevels.map((item) => `${item.areaName} ${item.level || "확인 필요"}`).join("\n"),
      comment: old?.comment ?? "",
      subject,
      selectedAreas: selectedLevels.map((item) => item.areaName),
    };
  });
}

export function ReportGenerator() {
  const [subject, setSubject] = useState<Subject>("국어");
  const [workspaces, setWorkspaces] = useState(createWorkspaces);
  const [pendingEvaluationPlan, setPendingEvaluationPlan] = useState<File | null>(null);
  const [sharedEvaluationPlan, setSharedEvaluationPlan] = useState<SharedEvaluationPlan | null>(() =>
    readSessionValue(SHARED_EVALUATION_PLAN_SESSION_KEY, SHARED_EVALUATION_PLAN_SESSION_VERSION, isSharedEvaluationPlan));
  const [selectedExample, setSelectedExample] = useState("positive");
  const [example, setExample] = useState<string>(EXAMPLE_PRESETS[0].text);
  const [instruction, setInstruction] = useState("");
  const [password, setPassword] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [usage, setUsage] = useState({ amountKrw: 0, budgetKrw: 30_000, status: "normal" as "normal" | "warning" | "limit" });
  const [notice, setNotice] = useState<Notice>({ type: "info", message: "과목을 선택하고 평가결과 PDF를 등록해 주세요." });
  const [savedReports, setSavedReports] = useState<SavedReportSummary[]>([]);
  const [selectedSavedReportId, setSelectedSavedReportId] = useState("");
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [isLoadingSavedReports, setIsLoadingSavedReports] = useState(false);
  const workspace = workspaces[subject];

  useEffect(() => {
    let active = true;
    fetch("/api/usage")
      .then(async (response) => {
        if (!response.ok) throw new Error("usage");
        return response.json();
      })
      .then((data) => { if (active) setUsage(data); })
      .catch(() => { if (active) setNotice({ type: "error", message: "이번 달 사용량을 확인하지 못했습니다." }); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoadingSavedReports(true);
    fetch("/api/saved-reports")
      .then(async (response) => {
        if (!response.ok) throw new Error("saved reports");
        return response.json();
      })
      .then((data) => { if (active) setSavedReports(data.reports ?? []); })
      .catch(() => { if (active) setNotice({ type: "error", message: "저장본 목록을 불러오지 못했습니다." }); })
      .finally(() => { if (active) setIsLoadingSavedReports(false); });
    return () => { active = false; };
  }, []);

  function updateWorkspace(patch: Partial<SubjectWorkspace>) {
    setWorkspaces((current) => ({ ...current, [subject]: { ...current[subject], ...patch } }));
  }

  function clearAnalysis(patch: Partial<SubjectWorkspace>) {
    updateWorkspace({ ...patch, analysis: null, rows: [] });
  }

  function acceptPlan(files: File[]) {
    const file = files[0];
    if (!file || !isAllowedDocument(file)) return setNotice({ type: "error", message: "평가 계획은 HWP, HWPX 또는 PDF만 등록할 수 있습니다." });
    setPendingEvaluationPlan(file);
  }

  function clearSharedEvaluationPlan() {
    removeSessionValue(SHARED_EVALUATION_PLAN_SESSION_KEY);
    setSharedEvaluationPlan(null);
    setNotice({ type: "info", message: "공통 평가 계획을 지웠습니다." });
  }

  function acceptWorksheets(files: File[]) {
    if (files.some((file) => !isAllowedDocument(file))) return setNotice({ type: "error", message: "수행평가지는 HWP, HWPX 또는 PDF만 등록할 수 있습니다." });
    clearAnalysis({ worksheets: [...workspace.worksheets, ...files] });
  }

  function acceptResults(files: File[]) {
    if (files.some((file) => !isPdfFile(file))) return setNotice({ type: "error", message: "영역별 평가결과는 PDF만 등록할 수 있습니다." });
    clearAnalysis({ resultFiles: [...workspace.resultFiles, ...files] });
  }

  async function analyzeDocuments() {
    if (workspace.resultFiles.length === 0) {
      setNotice({ type: "error", message: "영역별 평가결과 PDF를 등록해 주세요." });
      return;
    }
    if (workspace.areaCount > workspace.resultFiles.length) {
      setNotice({ type: "error", message: "평어 반영 영역 수는 등록한 평가결과 PDF 수보다 클 수 없습니다." });
      return;
    }

    const form = new FormData();
    form.append("areas", JSON.stringify(workspace.resultFiles.map((file, index) => {
      const fileKey = `area-file-${index}`;
      form.append(fileKey, file);
      return { areaId: `${subject}-area-${index + 1}`, fileKey };
    })));
    const planFileForRequest = pendingEvaluationPlan;
    if (planFileForRequest) form.append("evaluationPlan", planFileForRequest);
    workspace.worksheets.forEach((file) => form.append("worksheets", file));

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/parse-documents", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "문서 분석에 실패했습니다.");
      const analysis = body as DocumentAnalysisResponse;
      const unnamed = analysis.areas.filter((area) => !area.areaName).length;
      if (unnamed > 0) throw new Error(`${unnamed}개 파일에서 영역명을 확인하지 못했습니다. 파일 내용을 확인해 주세요.`);
      let activeSharedEvaluationPlan = sharedEvaluationPlan;
      if (planFileForRequest) {
        activeSharedEvaluationPlan = {
          fileName: planFileForRequest.name,
          extractedText: analysis.evaluationPlanText,
          analyzedAt: new Date().toISOString(),
        };
        writeSessionValue(
          SHARED_EVALUATION_PLAN_SESSION_KEY,
          SHARED_EVALUATION_PLAN_SESSION_VERSION,
          activeSharedEvaluationPlan,
        );
        setSharedEvaluationPlan(activeSharedEvaluationPlan);
        setPendingEvaluationPlan((current) => current === planFileForRequest ? null : current);
      }
      const rows = buildRows(subject, analysis, workspace.areaCount, workspace.rows);
      updateWorkspace({ analysis, rows });
      if (password.trim()) {
        setNotice({ type: "info", message: "첨부 자료 분석을 마쳤습니다. 전체 학생 평어를 바로 생성합니다." });
        await generateFrom(analysis, rows, "all", activeSharedEvaluationPlan?.extractedText ?? "");
      } else {
        setNotice({ type: "success", message: `${analysis.areas.length}개 영역과 ${rows.length}명의 익명 평가결과를 분석했습니다. 교사 접근 비밀번호를 입력하면 평어를 생성할 수 있습니다.` });
      }
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "문서 분석에 실패했습니다." });
    } finally {
      setIsAnalyzing(false);
    }
  }

  function updateRow(id: string, patch: Partial<StudentRow>) {
    updateWorkspace({ rows: workspace.rows.map((row) => row.id === id ? { ...row, ...patch } : row) });
  }

  function updateAnalyzedLevel(areaId: string, studentNumber: number, level: AchievementLevel) {
    if (!workspace.analysis) return;
    const analysis = {
      ...workspace.analysis,
      areas: workspace.analysis.areas.map((area) => area.areaId === areaId ? {
        ...area,
        students: area.students.map((student) => student.studentNumber === studentNumber ? { ...student, level, confirmed: true } : student),
      } : area),
    };
    try {
      updateWorkspace({ analysis, rows: buildRows(subject, analysis, workspace.areaCount, workspace.rows) });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "단계를 반영하지 못했습니다." });
    }
  }

  async function generateFrom(
    analysis: DocumentAnalysisResponse,
    rows: StudentRow[],
    mode: TargetMode,
    evaluationPlanText = sharedEvaluationPlan?.extractedText ?? "",
  ) {
    const targetIds = getTargetIds(rows, mode);
    if (targetIds.length === 0) return setNotice({ type: "error", message: "생성할 학생을 선택해 주세요." });
    if (!example.trim()) return setNotice({ type: "error", message: "학기말 종합의견 예시를 입력해 주세요." });
    if (!password.trim()) return setNotice({ type: "error", message: "교사 접근 비밀번호를 입력해 주세요." });
    if (usage.status === "limit") return setNotice({ type: "error", message: "이번 달 사용 한도에 도달했습니다." });

    const targets = rows.filter((row) => targetIds.includes(row.id));
    const students = targets.map((row) => ({
      studentNumber: row.number,
      levels: analysis.areas.flatMap((area) => {
        if (!row.selectedAreas?.includes(area.areaName)) return [];
        const student = area.students.find((item) => item.studentNumber === row.number);
        return student?.level ? [{ areaName: area.areaName, level: student.level }] : [];
      }),
    }));

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          password,
          subject,
          areaCount: workspace.areaCount,
          students,
          evaluationPlan: evaluationPlanText,
          worksheets: analysis.worksheetText,
          example,
          instruction: [instruction, "모든 문장은 기본적으로 명사형 종결어미로 끝나도록 작성해줘."].filter(Boolean).join("\n"),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "평어 생성에 실패했습니다.");
      updateWorkspace({ analysis, rows: rows.map((row) => {
        const generated = body.rows.find((item: { studentNumber: number }) => item.studentNumber === row.number);
        return generated && targetIds.includes(row.id) ? { ...row, evaluation: generated.selectedLevels, comment: generated.comment } : row;
      }) });
      if (body.usage) {
        const amountKrw = body.usage.amountKrw;
        const budgetKrw = body.usage.budgetKrw;
        setUsage({ amountKrw, budgetKrw, status: amountKrw >= budgetKrw ? "limit" : amountKrw >= budgetKrw * 0.9 ? "warning" : "normal" });
      }
      setNotice({ type: "success", message: `${targets.length}명의 ${subject} 학기말 종합의견을 생성했습니다.` });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "평어 생성에 실패했습니다." });
    } finally {
      setIsGenerating(false);
    }
  }

  async function generate(mode: TargetMode) {
    if (!workspace.analysis) return setNotice({ type: "error", message: "먼저 첨부 자료를 분석해 주세요." });
    await generateFrom(workspace.analysis, workspace.rows, mode);
  }

  async function refreshSavedReports() {
    setIsLoadingSavedReports(true);
    try {
      const response = await fetch("/api/saved-reports");
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "저장본 목록을 불러오지 못했습니다.");
      setSavedReports(body.reports ?? []);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "저장본 목록을 불러오지 못했습니다." });
    } finally {
      setIsLoadingSavedReports(false);
    }
  }

  function toSavedAreaLevels(row: StudentRow) {
    if (workspace.analysis) {
      return workspace.analysis.areas.map((area) => {
        const student = area.students.find((item) => item.studentNumber === row.number);
        return { areaName: area.areaName, level: student?.level || "확인 필요" };
      });
    }

    return row.evaluation.split("\n").filter(Boolean).map((line) => {
      const parts = line.trim().split(/\s+/);
      const level = parts.slice(-2).join(" ") || parts.at(-1) || "확인 필요";
      return { areaName: parts.slice(0, Math.max(1, parts.length - 2)).join(" ") || "영역", level };
    });
  }

  function rowAreaCount(rows: StudentRow[]) {
    return rows[0]?.selectedAreas?.length ?? workspace.areaCount;
  }

  async function saveCurrentReport() {
    if (workspace.rows.length === 0) return setNotice({ type: "error", message: "저장할 평어가 없습니다. 먼저 첨부 자료를 분석해 주세요." });

    setIsSavingReport(true);
    try {
      const response = await fetch("/api/saved-reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: `${subject} 저장본 ${new Date().toLocaleString("ko-KR")}`,
          subject,
          rows: workspace.rows.map((row) => ({
            studentNumber: row.number,
            anonymousName: `${row.number}번 학생`,
            subject,
            areaLevels: toSavedAreaLevels(row),
            selectedAreas: row.selectedAreas ?? [],
            comment: row.comment,
          })),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "저장에 실패했습니다.");
      setSelectedSavedReportId(body.report?.id ?? "");
      await refreshSavedReports();
      setNotice({ type: "success", message: "학생 실명과 원본 파일 없이 익명 저장본을 저장했습니다." });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "저장에 실패했습니다." });
    } finally {
      setIsSavingReport(false);
    }
  }

  async function loadSavedReport() {
    if (!selectedSavedReportId) return setNotice({ type: "error", message: "불러올 저장본을 선택해 주세요." });

    try {
      const response = await fetch(`/api/saved-reports/${selectedSavedReportId}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "저장본을 불러오지 못했습니다.");
      const report = body.report as SavedReportDetails;
      const loadedSubject = (SUBJECTS.includes(report.subject as Subject) ? report.subject : subject) as Subject;
      const areaNames = Array.from(new Set(report.rows.flatMap((row) => row.areaLevels.map((area) => area.areaName))));
      const analysis: DocumentAnalysisResponse = {
        roster: report.rows.map((row) => ({ studentNumber: row.studentNumber })),
        areas: areaNames.map((areaName, index) => ({
          areaId: `saved-${report.id}-${index}`,
          areaName,
          students: report.rows.map((row) => {
            const area = row.areaLevels.find((item) => item.areaName === areaName);
            return {
              studentNumber: row.studentNumber,
              level: (area?.level ?? "") as AchievementLevel | "",
              rawLevel: area?.level ?? "",
              confirmed: true,
            };
          }),
          warnings: [],
        })),
        evaluationPlanText: "",
        worksheetText: "",
        warnings: [],
      };
      const rows: StudentRow[] = report.rows.map((row) => ({
        id: `${loadedSubject}-${row.studentNumber}`,
        selected: false,
        number: row.studentNumber,
        name: row.anonymousName,
        reference: "",
        evaluation: row.areaLevels.map((area) => `${area.areaName} ${area.level}`).join("\n"),
        comment: row.comment,
        subject: loadedSubject,
        selectedAreas: row.selectedAreas,
      }));
      setSubject(loadedSubject);
      setWorkspaces((current) => ({
        ...current,
        [loadedSubject]: {
          ...current[loadedSubject],
          analysis,
          rows,
          areaCount: Math.max(1, rowAreaCount(rows)),
        },
      }));
      setNotice({ type: "success", message: `${report.title} 저장본을 불러왔습니다.` });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "저장본을 불러오지 못했습니다." });
    }
  }

  async function deleteSavedReport() {
    if (!selectedSavedReportId) return setNotice({ type: "error", message: "삭제할 저장본을 선택해 주세요." });

    try {
      const response = await fetch(`/api/saved-reports/${selectedSavedReportId}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "저장본을 삭제하지 못했습니다.");
      setSelectedSavedReportId("");
      await refreshSavedReports();
      setNotice({ type: "success", message: "저장본을 삭제했습니다." });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "저장본을 삭제하지 못했습니다." });
    }
  }

  async function copyResults() {
    try {
      await navigator.clipboard.writeText(toClipboardText(workspace.rows));
      setNotice({ type: "success", message: "현재 표 내용을 클립보드에 복사했습니다." });
    } catch {
      setNotice({ type: "error", message: "클립보드 복사에 실패했습니다." });
    }
  }

  function downloadCsv() {
    const url = URL.createObjectURL(new Blob([toCsv(workspace.rows)], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${subject}-교과평어.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function resetSubject() {
    setWorkspaces((current) => ({ ...current, [subject]: createWorkspaces()[subject] }));
    setNotice({ type: "info", message: `${subject} 작업 자료를 초기화했습니다.` });
  }

  return (
    <div className="report-page">
      <div className="page-heading">
        <div><div className="breadcrumb"><span>평가관리</span><i>/</i><b>학기말종합의견</b></div><h1>학기말종합의견</h1><p>과목별 평가 자료를 분석해 학생 번호 기준의 익명 교과 평어를 작성합니다.</p></div>
        <UsageBadge amountKrw={usage.amountKrw} budgetKrw={usage.budgetKrw} status={usage.status} />
      </div>

      <section className="privacy-notice" aria-label="개인정보 보호 안내">
        <b>개인정보 보호를 위한 익명 처리</b>
        <p>평가결과 파일의 학생 성명은 저장하거나 외부 서비스로 전송하지 않습니다. 학생 번호는 유지하고 성명은 자동으로 익명 처리합니다. 새로고침하거나 창을 닫으면 모든 작업 자료가 삭제됩니다.</p>
      </section>

      <section className="saved-report-panel" aria-label="익명 저장본 관리">
        <div>
          <b>익명 저장본</b>
          <p>학생 실명과 업로드 원본 파일은 저장하지 않고, 번호와 익명 이름 및 생성 평어만 계정별로 저장합니다.</p>
        </div>
        <div className="saved-report-controls">
          <select
            className="field"
            aria-label="저장본 선택"
            value={selectedSavedReportId}
            onChange={(event) => setSelectedSavedReportId(event.target.value)}
            disabled={isLoadingSavedReports || savedReports.length === 0}
          >
            <option value="">{isLoadingSavedReports ? "저장본 불러오는 중" : "저장본 선택"}</option>
            {savedReports.map((report) => (
              <option key={report.id} value={report.id}>{report.title}</option>
            ))}
          </select>
          <button type="button" className="button-primary" onClick={saveCurrentReport} disabled={isSavingReport || workspace.rows.length === 0}>
            {isSavingReport ? "저장 중" : "저장하기"}
          </button>
          <button type="button" className="button-secondary" onClick={loadSavedReport} disabled={!selectedSavedReportId}>
            불러오기
          </button>
          <button type="button" className="button-secondary button-danger" onClick={deleteSavedReport} disabled={!selectedSavedReportId}>
            삭제
          </button>
        </div>
      </section>

      <section className="subject-workspace" aria-labelledby="shared-evaluation-plan-title">
        <div className="section-heading">
          <div>
            <h2 id="shared-evaluation-plan-title">전체 평가 계획</h2>
            <p>이번 학기 전체 평가 계획을 올려 주세요. 한 번 분석하면 현재 브라우저 탭의 모든 과목에서 공통으로 사용합니다.</p>
          </div>
        </div>
        <div className="dropzone-grid">
          <FileDropzone
            label="전체 평가 계획"
            accept=".hwp,.hwpx,.pdf"
            files={pendingEvaluationPlan ? [pendingEvaluationPlan] : []}
            onFiles={acceptPlan}
            onRemove={() => setPendingEvaluationPlan(null)}
          />
          {sharedEvaluationPlan && (
            <div className="file-dropzone" aria-label="공통 평가 계획 상태">
              <div className="file-dropzone__icon" aria-hidden="true">✓</div>
              <div>
                <b>분석 완료</b>
                <p>{sharedEvaluationPlan.fileName}</p>
              </div>
              <button type="button" className="button-secondary button-danger" onClick={clearSharedEvaluationPlan}>공통 계획 지우기</button>
            </div>
          )}
        </div>
      </section>

      <section className="subject-workspace" aria-labelledby="subject-workspace-title">
        <div className="section-heading"><div><h2 id="subject-workspace-title">과목별 자료 작업공간</h2><p>과목을 선택한 뒤 해당 과목의 자료를 한 번에 등록해 주세요.</p></div></div>
        <div className="subject-tabs" role="tablist" aria-label="과목 선택">
          {SUBJECTS.map((item) => <button key={item} type="button" role="tab" aria-selected={subject === item} className={subject === item ? "is-active" : ""} onClick={() => setSubject(item)}>{item}</button>)}
        </div>

        <div className="workspace-settings">
          <label><span>평어 반영 영역 수</span><select className="field" aria-label="평어 반영 영역 수" value={workspace.areaCount} onChange={(event) => clearAnalysis({ areaCount: Number(event.target.value) })}>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => <option key={count} value={count}>{count}개</option>)}</select><small>등록한 영역 중 학생별 평어에 반영할 개수입니다.</small></label>
        </div>

        <div className="dropzone-grid">
          <FileDropzone label="수행평가지" accept=".hwp,.hwpx,.pdf" multiple files={workspace.worksheets} onFiles={acceptWorksheets} onRemove={(index) => clearAnalysis({ worksheets: workspace.worksheets.filter((_, itemIndex) => itemIndex !== index) })} />
          <FileDropzone label="영역별 평가결과" accept=".pdf,application/pdf" multiple files={workspace.resultFiles} onFiles={acceptResults} onRemove={(index) => clearAnalysis({ resultFiles: workspace.resultFiles.filter((_, itemIndex) => itemIndex !== index) })} />
        </div>
        <div className="analysis-actions"><button type="button" className="button-primary" onClick={analyzeDocuments} disabled={isAnalyzing}>{isAnalyzing ? "자료 분석 중" : "첨부 자료 분석"}</button><span>영역 이름과 학생별 단계는 평가결과 PDF에서 자동으로 확인합니다.</span></div>
      </section>

      <details className="reference-panel writing-panel" open>
        <summary><span className="summary-icon" aria-hidden="true">＋</span><span><b>평어 작성 설정</b><small>문체 예시와 추가 지시, 교사 접근 비밀번호를 입력해 주세요.</small></span></summary>
        <div className="reference-content">
          <div className="writing-settings">
            <label><span>예시문 선택</span><select className="field" aria-label="예시문 선택" value={selectedExample} onChange={(event) => { const preset = EXAMPLE_PRESETS.find((item) => item.id === event.target.value); if (preset) { setSelectedExample(preset.id); setExample(preset.text); } }}>{EXAMPLE_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
            <label><span>학기말 종합의견 예시</span><textarea className="textarea" aria-label="학기말 종합의견 예시" value={example} onChange={(event) => setExample(event.target.value)} rows={4} /></label>
            <label><span>추가 지시사항</span><textarea className="textarea" aria-label="추가 지시사항" value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={4} /></label>
          </div>
          <label className="password-setting"><span>교사 접근 비밀번호 <b>필수</b></span><input className="field" type="password" aria-label="교사 접근 비밀번호" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /><small>.env.local의 TEACHER_ACCESS_PASSWORD 값입니다. 생성 요청 확인에만 사용하며 저장하지 않습니다.</small></label>
        </div>
      </details>

      <div className={`notice notice--${notice?.type ?? "info"}`} role="status" aria-live="polite"><span aria-hidden="true">{notice?.type === "error" ? "!" : notice?.type === "success" ? "✓" : "i"}</span>{notice?.message}</div>

      {workspace.analysis && workspace.rows.length > 0 && (
        <section className="table-panel" aria-labelledby="student-table-title">
          <div className="table-toolbar">
            <div><h2 id="student-table-title">{subject} 학생별 평가결과 및 종합의견</h2><span>Total {workspace.rows.length}</span></div>
            <div className="toolbar-buttons toolbar-buttons--primary"><button type="button" className="button-primary" disabled={isGenerating || usage.status === "limit"} onClick={() => generate("smart")}>{isGenerating ? "생성 중" : "교과평어 생성"}</button><button type="button" className="button-secondary" onClick={() => generate("selected")}>선택 학생만 생성</button><button type="button" className="button-secondary" onClick={() => generate("all")}>전체 학생 생성</button></div>
            <div className="toolbar-divider" />
            <div className="toolbar-buttons"><button type="button" className="button-secondary" onClick={copyResults}>결과 복사</button><button type="button" className="button-secondary" onClick={downloadCsv}>CSV 다운로드</button><button type="button" className="button-quiet" onClick={resetSubject}>초기화</button></div>
          </div>
          <div className="table-scroll">
            <table className="student-table student-table--subject-result">
              <colgroup>
                <col className="col-check" />
                <col className="col-number" />
                <col className="col-name" />
                <col className="col-subject" />
                {workspace.analysis.areas.map((area) => <col className="col-area-level" key={`col-${area.areaId}`} />)}
                <col className="col-selected-areas" />
                <col className="col-comment" />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-check">선택</th>
                  <th className="col-number">번호</th>
                  <th className="col-name">이름</th>
                  <th className="col-subject">과목</th>
                  {workspace.analysis.areas.map((area) => (
                    <th className="col-area-level" key={area.areaId}>{area.areaName}</th>
                  ))}
                  <th className="col-selected-areas">최종 반영</th>
                  <th className="col-comment">{subject} 학기말 종합의견</th>
                </tr>
              </thead>
              <tbody>
                {workspace.rows.map((row) => (
                  <tr key={row.id} aria-label={`${row.number}번 학생 행`}>
                    <td className="col-check"><input type="checkbox" aria-label={`${row.name} 선택`} checked={row.selected} onChange={(event) => updateRow(row.id, { selected: event.target.checked })} /></td>
                    <td className="col-number">{row.number}</td>
                    <td className="col-name">{row.name}</td>
                    <td className="col-subject">{subject}</td>
                    {workspace.analysis!.areas.map((area) => {
                      const student = area.students.find((item) => item.studentNumber === row.number);
                      return (
                        <td className="col-area-level" key={`${row.id}-${area.areaId}`}>
                          <select
                            className="area-level-select"
                            aria-label={`${row.name} ${area.areaName} 성취 단계`}
                            value={student?.level ?? ""}
                            onChange={(event) => updateAnalyzedLevel(area.areaId, row.number, event.target.value as AchievementLevel)}
                          >
                            <option value="">확인 필요</option>
                            {ACHIEVEMENT_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                          </select>
                        </td>
                      );
                    })}
                    <td className="col-selected-areas">{row.selectedAreas?.join(", ")}</td>
                    <td className="col-comment"><textarea className="table-textarea table-textarea--comment" aria-label={`${row.name} 학기말 종합의견`} value={row.comment} onChange={(event) => updateRow(row.id, { comment: event.target.value })} rows={4} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
