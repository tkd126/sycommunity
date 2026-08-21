"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { HeaderSelectionCheckbox } from "@/components/HeaderSelectionCheckbox";

import { generateClubActivityRecord } from "@/lib/club-record";
import { proofreadInBatches } from "@/lib/proofread-client";
import { readSessionValue, removeSessionValue, writeSessionValue } from "@/lib/session-storage";

const CLUB_SESSION_KEY = "student-record-helper:club:v1";
const CLUB_SESSION_VERSION = 1;

type ClubRow = {
  id: string;
  selected: boolean;
  number: number;
  anonymousName: string;
  activityMemo: string;
  record: string;
  proofreadStatus?: "clean" | "corrected";
};

type ClubSessionState = {
  rows: ClubRow[];
};

function isClubSessionState(value: unknown): value is ClubSessionState {
  if (!value || typeof value !== "object") return false;

  const rows = (value as { rows?: unknown }).rows;
  if (!Array.isArray(rows) || rows.length === 0) return false;

  return rows.every((row) => {
    if (!row || typeof row !== "object") return false;
    const item = row as Partial<ClubRow>;
    return typeof item.id === "string"
      && typeof item.selected === "boolean"
      && typeof item.number === "number"
      && Number.isFinite(item.number)
      && typeof item.anonymousName === "string"
      && typeof item.activityMemo === "string"
      && typeof item.record === "string"
      && (item.proofreadStatus === undefined || item.proofreadStatus === "clean" || item.proofreadStatus === "corrected");
  });
}

function createRows(count = 5): ClubRow[] {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return {
      id: `club-row-${number}-${Date.now()}-${index}`,
      selected: false,
      number,
      anonymousName: `${number}번 학생`,
      activityMemo: "",
      record: "",
    };
  });
}

function toCsv(rows: ClubRow[]) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [
    ["번호", "익명 이름", "동아리 활동 내용", "동아리 활동 기록"].map(escape).join(","),
    ...rows.map((row) => [row.number, row.anonymousName, row.activityMemo, row.record].map(escape).join(",")),
  ].join("\n");
}

export function ClubActivityGenerator() {
  const [rows, setRows] = useState<ClubRow[]>(() =>
    readSessionValue(CLUB_SESSION_KEY, CLUB_SESSION_VERSION, isClubSessionState)?.rows ?? createRows(),
  );
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [isProofreading, setIsProofreading] = useState(false);
  const [proofreadBackup, setProofreadBackup] = useState<Map<string, string> | null>(null);
  const [studentCount, setStudentCount] = useState(() => String(rows.length));
  const skipNextSessionWrite = useRef(false);

  useEffect(() => {
    if (skipNextSessionWrite.current) {
      skipNextSessionWrite.current = false;
      return;
    }
    writeSessionValue(CLUB_SESSION_KEY, CLUB_SESSION_VERSION, { rows });
  }, [rows]);

  useEffect(() => {
    setStudentCount(String(rows.length));
  }, [rows.length]);

  const selectedCount = useMemo(() => rows.filter((row) => row.selected).length, [rows]);

  const updateRow = (id: string, patch: Partial<ClubRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const generateRecords = (mode: "selected" | "all" | "smart") => {
    setProofreadBackup(null);
    const hasSelection = rows.some((row) => row.selected);
    const shouldGenerate = (row: ClubRow) => {
      if (mode === "all") return true;
      if (mode === "selected") return row.selected;
      return hasSelection ? row.selected : true;
    };

    let changedCount = 0;
    setRows((current) => current.map((row) => {
      if (!shouldGenerate(row)) return row;
      const source = row.activityMemo.trim();
      if (!source) return row;
      changedCount += 1;
      return { ...row, record: generateClubActivityRecord(source), proofreadStatus: undefined };
    }));
    setMessage(changedCount > 0 ? `${changedCount}명 기록을 생성했습니다.` : "학생별 동아리 활동 내용을 입력해 주세요.");
  };

  const applyStudentCount = () => {
    const count = Number(studentCount);
    if (!Number.isInteger(count) || count < 1 || count > 40) {
      setMessage("학생 수는 1명부터 40명까지 입력해 주세요.");
      return;
    }
    setProofreadBackup(null);
    setRows((current) => {
      if (count <= current.length) return current.slice(0, count);
      const added = Array.from({ length: count - current.length }, (_, index) => {
        const number = current.length + index + 1;
        return {
          id: `club-row-${number}-${Date.now()}-${index}`,
          selected: false,
          number,
          anonymousName: `${number}번 학생`,
          activityMemo: "",
          record: "",
        };
      });
      return [...current, ...added];
    });
    setMessage(`${count}명 학생 목록을 준비했습니다.`);
  };

  const setAllSelected = (selected: boolean) => {
    setRows((current) => current.map((row) => ({ ...row, selected })));
  };

  const addRow = () => {
    setRows((current) => {
      const nextNumber = current.length > 0 ? Math.max(...current.map((row) => row.number)) + 1 : 1;
      return [
        ...current,
        {
          id: `club-row-${nextNumber}-${Date.now()}`,
          selected: false,
          number: nextNumber,
          anonymousName: `${nextNumber}번 학생`,
          activityMemo: "",
          record: "",
        },
      ];
    });
  };

  const deleteSelectedRows = () => {
    setRows((current) => {
      const filtered = current.filter((row) => !row.selected);
      return filtered.length > 0 ? filtered : createRows(1);
    });
  };

  const resetRows = () => {
    skipNextSessionWrite.current = true;
    removeSessionValue(CLUB_SESSION_KEY);
    setRows(createRows());
    setPassword("");
    setIsProofreading(false);
    setProofreadBackup(null);
    setMessage("");
  };

  const proofreadResults = async () => {
    const targets = rows.filter((row) => row.record.trim()).map((row) => ({ id: row.id, comment: row.record }));
    if (targets.length === 0) {
      setMessage("맞춤법을 검사할 동아리 활동 기록이 없습니다.");
      return;
    }
    if (!password) {
      setMessage("교사 접근 비밀번호를 입력해 주세요.");
      return;
    }
    setIsProofreading(true);
    setMessage(`맞춤법 검사 중 0/${targets.length}개 (0%)`);
    try {
      const corrected = await proofreadInBatches({
        password,
        rows: targets,
        onProgress: (completed, total) => setMessage(`맞춤법 검사 중 ${completed}/${total}개 (${Math.round(completed / total * 100)}%)`),
      });
      const correctedById = new Map(corrected.map((row) => [row.id, row.comment]));
      setProofreadBackup(new Map(targets.map((row) => [row.id, row.comment])));
      setRows((current) => current.map((row) => {
        const correctedRecord = correctedById.get(row.id);
        if (correctedRecord === undefined) return row;
        return {
          ...row,
          record: correctedRecord,
          proofreadStatus: correctedRecord === row.record ? "clean" : "corrected",
        };
      }));
      setMessage(`${targets.length}개 동아리 활동 기록의 맞춤법 검사를 완료했습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "맞춤법 검사에 실패했습니다.");
    } finally {
      setIsProofreading(false);
    }
  };

  const restoreBeforeProofread = () => {
    if (!proofreadBackup) return;
    setRows((current) => current.map((row) => proofreadBackup.has(row.id) ? { ...row, record: proofreadBackup.get(row.id) ?? row.record, proofreadStatus: undefined } : row));
    setProofreadBackup(null);
    setMessage("맞춤법 검사 전 결과로 되돌렸습니다.");
  };
  const copyResults = async () => {
    const text = rows.map((row) => `${row.number}\t${row.anonymousName}\t${row.record}`).join("\n");
    await navigator.clipboard?.writeText(text);
    setMessage("현재 결과를 클립보드에 복사했습니다.");
  };

  const downloadCsv = () => {
    const blob = new Blob([`\uFEFF${toCsv(rows)}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "동아리활동기록.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("CSV 파일을 내려받았습니다.");
  };

  return (
    <section className="report-page club-page">
      <div className="page-heading">
        <div>
          <div className="breadcrumb">
            <span>동아리활동</span>
            <i>/</i>
            <b>동아리 활동 기록 작성기</b>
          </div>
          <h1>동아리 활동 기록 작성기</h1>
          <p>학생별 동아리 활동 내용을 바탕으로 생활기록부에 넣기 좋은 문장을 만듭니다.</p>
        </div>
      </div>

      <div className="privacy-notice">
        <b>작성 안내</b>
        <p>
          1번 학생 옆에 해당 학생의 동아리 활동 내용을 입력해 주세요.
          단어, 짧은 메모, 활동 키워드만 입력해도 됩니다.
          제품명과 고유명사는 일반 표현으로 바꾸고, 과장·비교·낙인처럼 민원 소지가 큰 표현은 순화합니다.
        </p>
      </div>

      <div className="club-roster-setup" role="group" aria-label="학생 목록 설정">
        <label>
          <span>학생 수</span>
          <input type="number" min="1" max="40" step="1" value={studentCount} onChange={(event) => setStudentCount(event.target.value)} aria-label="학생 수" />
        </label>
        <button type="button" className="button-secondary" onClick={applyStudentCount}>학생 목록 만들기</button>
        <small>1명부터 40명까지 설정할 수 있으며 기존 앞번호의 작성 내용은 유지됩니다.</small>
      </div>

      <div className="proofread-access-row">
        <label><span>교사 접근 비밀번호</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" aria-label="동아리 교사 접근 비밀번호" /></label>
        <small>맞춤법 검사 요청에만 사용하며 저장하지 않습니다.</small>
      </div>

      {message ? (
        <div className="notice notice--success">
          <span aria-hidden="true">✓</span>
          {message}
        </div>
      ) : null}

      <section className="table-panel club-table-panel">
        <div className="table-toolbar">
          <div>
            <h2>학생별 동아리 활동 기록</h2>
            <span>Total {rows.length}</span>
            {selectedCount > 0 ? <span>선택 {selectedCount}</span> : null}
          </div>
          <div className="toolbar-workflow">

            <div className="toolbar-action-group toolbar-action-group--generation" role="group" aria-label="활동 기록 생성">
              <span className="toolbar-action-group__label">활동 기록 생성</span>
              <button type="button" className="button-primary toolbar-main-action" onClick={() => generateRecords("smart")}>동아리 활동 기록 생성</button>

            </div>
            <div className="toolbar-action-group toolbar-action-group--results" role="group" aria-label="결과 관리">
              <span className="toolbar-action-group__label">결과 관리</span>
              <button type="button" className="button-secondary" disabled={isProofreading} onClick={proofreadResults}>{isProofreading ? "맞춤법 검사 중…" : "전체 결과 맞춤법 검사"}</button>
              {proofreadBackup ? <button type="button" className="button-secondary" disabled={isProofreading} onClick={restoreBeforeProofread}>검사 전으로 되돌리기</button> : null}
              <button type="button" className="button-secondary" onClick={copyResults}>결과 복사</button>
              <button type="button" className="button-secondary" onClick={downloadCsv}>CSV 다운로드</button>
              <button type="button" className="button-secondary" onClick={addRow}>행 추가</button>
              <button type="button" className="button-quiet button-danger" onClick={deleteSelectedRows}>선택 삭제</button>
              <button type="button" className="button-quiet" onClick={resetRows}>초기화</button>
            </div>
          </div>
        </div>
        <div className="table-scroll">
          <table className="student-table club-table">
            <thead>
              <tr>
                <th className="col-check">
                  <HeaderSelectionCheckbox
                    selectedCount={selectedCount}
                    totalCount={rows.length}
                    label="동아리 전체 학생 선택"
                    onChange={setAllSelected}
                  />
                </th>
                <th className="col-number">번호</th>
                <th className="col-name">익명 이름</th>
                <th className="col-club-memo">동아리 활동 내용</th>
                <th className="col-club-record">동아리 활동 기록</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="col-check">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(event) => updateRow(row.id, { selected: event.target.checked })}
                      aria-label={`${row.number}번 선택`}
                    />
                  </td>
                  <td className="col-number">
                    <input
                      className="table-input table-input--number"
                      value={row.number}
                      onChange={(event) => {
                        const number = Number(event.target.value) || row.number;
                        updateRow(row.id, { number, anonymousName: `${number}번 학생` });
                      }}
                      aria-label={`${row.number}번 번호`}
                    />
                  </td>
                  <td className="col-name">
                    <input className="table-input" value={row.anonymousName} readOnly aria-label={`${row.number}번 익명 이름`} />
                  </td>
                  <td className="col-club-memo">
                    <textarea
                      className="table-textarea table-textarea--evaluation"
                      value={row.activityMemo}
                      onChange={(event) => updateRow(row.id, { activityMemo: event.target.value })}
                      aria-label={`${row.number}번 동아리 활동 내용`}
                      placeholder="예 블록 모형 건축물, 춤 연습, 점토 작품"
                    />
                  </td>
                  <td className="col-club-record">
                    <textarea
                      className="table-textarea table-textarea--comment"
                      value={row.record}
                      onChange={(event) => updateRow(row.id, { record: event.target.value, proofreadStatus: undefined })}
                      aria-label={`${row.number}번 동아리 활동 기록`}
                      placeholder="생성된 활동 기록이 표시됩니다. 직접 수정할 수 있습니다."
                    />
                    {row.proofreadStatus ? (
                      <span
                        className={`proofread-status proofread-status--${row.proofreadStatus}`}
                        aria-label={`${row.number}번 맞춤법 검사 상태`}
                      >
                        {row.proofreadStatus === "clean" ? "문제 없음" : "수정됨"}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footnote">
          <span aria-hidden="true">※</span>
          정성적인 표현은 사용할 수 있지만, 특정 학생 비교·과장·낙인 표현은 민원 소지를 줄이기 위해 순화합니다.
        </div>
      </section>
    </section>
  );
}
