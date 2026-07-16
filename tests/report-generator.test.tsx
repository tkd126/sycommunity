import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReportGenerator } from "@/components/ReportGenerator";

const AREA_NAMES = ["문학", "읽기", "쓰기", "문법"];

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.endsWith("/api/usage")) {
    return new Response(JSON.stringify({ amountKrw: 1000, budgetKrw: 30000, status: "normal" }));
  }
  if (url.endsWith("/api/parse-documents")) {
    const evaluationPlan = (init?.body as FormData | undefined)?.get("evaluationPlan");
    return new Response(JSON.stringify({
      roster: Array.from({ length: 6 }, (_, index) => ({ studentNumber: index + 1 })),
      areas: AREA_NAMES.map((areaName, index) => ({
        areaId: `area-${index + 1}`,
        areaName,
        students: Array.from({ length: 6 }, (_, studentIndex) => ({
          studentNumber: studentIndex + 1,
          level: index === 0 ? "매우 잘함" : "잘함",
          rawLevel: index === 0 ? "매우잘함" : "잘함",
          confirmed: true,
        })),
        warnings: [],
      })),
      evaluationPlanText: evaluationPlan instanceof File ? `${evaluationPlan.name} 추출 텍스트` : "",
      worksheetText: "익명 수행평가지",
      warnings: [],
    }));
  }
  if (url.endsWith("/api/generate-report")) {
    const body = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      subject: body.subject,
      warning: "",
      rows: body.students.map((student: { studentNumber: number }) => ({
        studentNumber: student.studentNumber,
        selectedLevels: "문학 매우 잘함 읽기 잘함 쓰기 잘함",
        comment: "평가 내용을 바탕으로 자신의 생각을 자연스럽게 표현함.",
      })),
      usage: { amountKrw: 1001, budgetKrw: 30000 },
    }));
  }
  throw new Error(`Unexpected fetch: ${url}`);
});

async function fillAreaEvidence(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(
    screen.getByLabelText("영역별 평가결과 파일"),
    AREA_NAMES.map((name, index) => new File([`area-${index + 1}`], `${name}-평가결과.pdf`, { type: "application/pdf" })),
  );
}

async function fillRequiredInputs() {
  const user = userEvent.setup();
  await fillAreaEvidence(user);
  await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));
  await screen.findByText("Total 6");
  await user.type(screen.getByLabelText("교사 접근 비밀번호"), "teacher-password");
  return user;
}

describe("ReportGenerator", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("초기에는 조회 조건과 학생 표 없이 과목별 파일 작업공간을 표시한다", () => {
    render(<ReportGenerator />);

    expect(screen.getByRole("heading", { name: "학기말종합의견" })).toBeInTheDocument();
    expect(screen.queryByText("조회 조건")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "국어" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "도덕" })).toBeInTheDocument();
    expect(screen.getByLabelText("평어 반영 영역 수")).toHaveValue("3");
    expect(screen.getByLabelText("영역별 평가결과 파일")).toBeInTheDocument();
    expect(screen.getByText("이번 학기 전체 평가 계획을 올려 주세요. 한 번 분석하면 현재 브라우저 탭의 모든 과목에서 공통으로 사용합니다.")).toBeInTheDocument();
  });

  it("비밀번호가 없으면 생성하지 않고 입력 안내를 표시한다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await fillAreaEvidence(user);
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));
    await screen.findByText("Total 6");
    await user.click(screen.getByRole("button", { name: "전체 학생 생성" }));

    expect(screen.getByRole("status")).toHaveTextContent("교사 접근 비밀번호를 입력해 주세요");
    expect(screen.getByLabelText("1번 학생 학기말 종합의견")).toHaveValue("");
  });

  it("영역별 필수 PDF가 없으면 생성하지 않는다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("교사 접근 비밀번호"), "teacher-password");
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));

    expect(screen.getByRole("status")).toHaveTextContent("영역별 평가결과 PDF를 등록해 주세요");
  });

  it("전체 대상의 평어를 생성하고 이름은 전송하지 않으며 직접 수정할 수 있다", async () => {
    render(<ReportGenerator />);
    const user = await fillRequiredInputs();
    await user.click(screen.getByRole("button", { name: "전체 학생 생성" }));

    const comment = screen.getByLabelText("1번 학생 학기말 종합의견");
    expect((comment as HTMLTextAreaElement).value).toContain("평가 내용을 바탕으로");
    const generationCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/api/generate-report"));
    expect(String(generationCall?.[1]?.body)).not.toContain("김하늘");
    fireEvent.change(comment, { target: { value: "교사가 수정한 평어" } });
    expect(comment).toHaveValue("교사가 수정한 평어");
  });

  it("분석한 명렬표에 맞춰 학생 행을 자동으로 추가하거나 제거한다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await fillAreaEvidence(user);
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));

    expect(await screen.findByText("Total 6")).toBeInTheDocument();
    expect(screen.getAllByText("6번 학생").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "행 추가" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "선택 삭제" })).not.toBeInTheDocument();
  }, 10_000);

  it("비밀번호가 입력된 상태에서 첨부 자료를 분석하면 전체 학생 평어 생성을 바로 요청한다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("교사 접근 비밀번호"), "teacher-password");
    await fillAreaEvidence(user);
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));

    expect(await screen.findByLabelText("1번 학생 학기말 종합의견")).toHaveValue("평가 내용을 바탕으로 자신의 생각을 자연스럽게 표현함.");
    const generationCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/api/generate-report"));
    expect(generationCalls).toHaveLength(1);
  }, 10_000);

  it("별도 확인 패널 없이 최종 표에서 영역별 성취 단계를 바로 표시한다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await fillAreaEvidence(user);
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));

    expect(await screen.findByText("Total 6")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "영역별 평가 단계 확인" })).not.toBeInTheDocument();
    for (const areaName of AREA_NAMES) expect(screen.getByRole("columnheader", { name: areaName })).toBeInTheDocument();
    expect(screen.getByLabelText("1번 학생 문학 성취 단계")).toHaveValue("매우 잘함");
  }, 10_000);

  it("선택한 학생에게만 평어를 생성한다", async () => {
    render(<ReportGenerator />);
    const user = await fillRequiredInputs();
    await user.click(screen.getByLabelText("2번 학생 선택"));
    await user.click(screen.getByRole("button", { name: "선택 학생만 생성" }));

    expect(screen.getByLabelText("1번 학생 학기말 종합의견")).toHaveValue("");
    expect((screen.getByLabelText("2번 학생 학기말 종합의견") as HTMLTextAreaElement).value).toContain("평가 내용을 바탕으로");
  }, 10_000);

  it("기본 생성 버튼은 선택된 학생이 있으면 선택 학생만 생성한다", async () => {
    render(<ReportGenerator />);
    const user = await fillRequiredInputs();
    await user.click(screen.getByLabelText("2번 학생 선택"));
    await user.click(screen.getByRole("button", { name: "교과평어 생성" }));

    expect(screen.getByLabelText("1번 학생 학기말 종합의견")).toHaveValue("");
    expect((screen.getByLabelText("2번 학생 학기말 종합의견") as HTMLTextAreaElement).value).toContain("평가 내용을 바탕으로");
  }, 10_000);

  it("현재 표를 탭 구분 형식으로 클립보드에 복사한다", async () => {
    render(<ReportGenerator />);
    const user = await fillRequiredInputs();
    await user.click(screen.getByRole("button", { name: "결과 복사" }));

    const copied = await navigator.clipboard.readText();
    expect(copied).toContain("번호\t익명 성명\t과목\t선택된 영역\t영역별 성취 단계\t학기말 종합의견");
    expect(copied).toContain("1\t1번 학생");
  });

  it("전체 평가 계획을 분석하면 과목을 바꿔도 분석 완료 파일을 표시한다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await user.upload(
      screen.getByLabelText("전체 평가 계획 파일"),
      new File(["plan"], "2026-전체-평가계획.hwpx", { type: "application/octet-stream" }),
    );
    await fillAreaEvidence(user);
    await user.upload(screen.getByLabelText("수행평가지 파일"), [
      new File(["paper-1"], "문학-수행평가지.pdf", { type: "application/pdf" }),
      new File(["paper-2"], "읽기-수행평가지.hwp", { type: "application/octet-stream" }),
    ]);
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));

    expect(await screen.findByText("2026-전체-평가계획.hwpx")).toBeInTheDocument();
    expect(screen.getByText("분석 완료")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "전체 평가 계획 파일 삭제" })).not.toBeInTheDocument();
    expect(screen.getByText("문학-수행평가지.pdf")).toBeInTheDocument();
    expect(screen.getByText("읽기-수행평가지.hwp")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "사회" }));
    expect(screen.getByText("2026-전체-평가계획.hwpx")).toBeInTheDocument();
    expect(screen.getByText("분석 완료")).toBeInTheDocument();
  }, 10_000);

  it("공통 평가 계획을 unmount 후 복원하고 추출 텍스트로 생성한다", async () => {
    const first = render(<ReportGenerator />);
    const user = userEvent.setup();
    await user.upload(
      screen.getByLabelText("전체 평가 계획 파일"),
      new File(["plan"], "복원-평가계획.pdf", { type: "application/pdf" }),
    );
    await fillAreaEvidence(user);
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));
    await screen.findByText("Total 6");
    first.unmount();

    render(<ReportGenerator />);
    expect(screen.getByText("복원-평가계획.pdf")).toBeInTheDocument();
    await fillAreaEvidence(user);
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));
    await screen.findByText("Total 6");
    await user.type(screen.getByLabelText("교사 접근 비밀번호"), "teacher-password");
    await user.click(screen.getByRole("button", { name: "전체 학생 생성" }));

    const generationCall = fetchMock.mock.calls.findLast(([url]) => String(url).endsWith("/api/generate-report"));
    expect(JSON.parse(String(generationCall?.[1]?.body)).evaluationPlan).toBe("복원-평가계획.pdf 추출 텍스트");
  }, 10_000);

  it("새 공통 평가 계획은 기존 세션 값을 교체하고 지우기는 공통 상태만 제거한다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await fillAreaEvidence(user);
    await user.upload(
      screen.getByLabelText("전체 평가 계획 파일"),
      new File(["old"], "기존-계획.hwpx", { type: "application/octet-stream" }),
    );
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));
    await screen.findByText("기존-계획.hwpx");

    await user.upload(
      screen.getByLabelText("전체 평가 계획 파일"),
      new File(["new"], "새-계획.hwpx", { type: "application/octet-stream" }),
    );
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));
    await screen.findByText("새-계획.hwpx");

    const stored = JSON.parse(sessionStorage.getItem("student-record-helper:evaluation-plan:v1") ?? "null");
    expect(stored).toMatchObject({
      version: 1,
      value: {
        fileName: "새-계획.hwpx",
        extractedText: "새-계획.hwpx 추출 텍스트",
      },
    });
    expect(new Date(stored.value.analyzedAt).toISOString()).toBe(stored.value.analyzedAt);

    await user.click(screen.getByRole("button", { name: "공통 계획 지우기" }));
    expect(sessionStorage.getItem("student-record-helper:evaluation-plan:v1")).toBeNull();
    expect(screen.queryByText("새-계획.hwpx")).not.toBeInTheDocument();
    expect(screen.getByText("문학-평가결과.pdf")).toBeInTheDocument();
  }, 10_000);

  it("새 계획 파일 선택 삭제와 분석된 공통 계획 삭제를 구분한다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await fillAreaEvidence(user);
    await user.upload(
      screen.getByLabelText("전체 평가 계획 파일"),
      new File(["shared"], "분석된-계획.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));
    await screen.findByText("분석된-계획.pdf");

    await user.upload(
      screen.getByLabelText("전체 평가 계획 파일"),
      new File(["pending"], "분석전-계획.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "전체 평가 계획 파일 삭제" }));

    expect(screen.queryByText("분석전-계획.pdf")).not.toBeInTheDocument();
    expect(screen.getByText("분석된-계획.pdf")).toBeInTheDocument();
    expect(sessionStorage.getItem("student-record-helper:evaluation-plan:v1")).toContain("분석된-계획.pdf 추출 텍스트");
  }, 10_000);

  it("공통 계획 세션 JSON에는 허용된 계획 메타데이터만 저장한다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await fillAreaEvidence(user);
    await user.upload(
      screen.getByLabelText("전체 평가 계획 파일"),
      new File(["plan"], "공통-계획.hwpx", { type: "application/octet-stream" }),
    );
    await user.upload(
      screen.getByLabelText("수행평가지 파일"),
      new File(["worksheet"], "김하늘-수행평가지.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));
    await screen.findByText("공통-계획.hwpx");

    const stored = sessionStorage.getItem("student-record-helper:evaluation-plan:v1") ?? "";
    expect(stored).not.toContain("문학-평가결과.pdf");
    expect(stored).not.toContain("김하늘-수행평가지.pdf");
    expect(stored).not.toContain("김하늘");
    expect(Object.keys(JSON.parse(stored).value).sort()).toEqual(["analyzedAt", "extractedText", "fileName"]);
  });

  it("기본 예시문을 선택하고 직접 수정할 수 있다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("예시문 선택"), "growth");
    const example = screen.getByLabelText("학기말 종합의견 예시");
    expect((example as HTMLTextAreaElement).value).toContain("기초를 다지며");
    await user.clear(example);
    await user.type(example, "교사가 수정한 예시문");
    expect(example).toHaveValue("교사가 수정한 예시문");
  });

  it("일곱 가지 문체 예시를 선택할 수 있다", () => {
    render(<ReportGenerator />);

    const options = within(screen.getByLabelText("예시문 선택")).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "긍정 강조형",
      "성장 중심형",
      "협력 중심형",
      "탐구 중심형",
      "성실 참여형",
      "간결형",
      "구체적 서술형",
    ]);
  });

});
