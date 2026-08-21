import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HwpxReader } from "@ssabrojs/hwpxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreativeActivityGenerator } from "@/components/CreativeActivityGenerator";

const parsedRows = [
  {
    id: "activity-1",
    selected: false,
    date: "3/12",
    category: "자율",
    activity: "학급 약속 정하기",
    hours: 1,
    needsReview: false,
    comment: "",
  },
  {
    id: "activity-2",
    selected: false,
    date: "3/12",
    category: "봉사",
    activity: "교실 정리하기",
    hours: 2,
    needsReview: false,
    comment: "",
  },
];

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  } as Response);
}

async function uploadAndAnalyze(rows = parsedRows) {
  const user = userEvent.setup();
  const file = new File(["private raw timetable"], "annual.pdf", { type: "application/pdf" });
  await user.upload(screen.getByLabelText("연간시간표 파일"), file);
  await user.type(screen.getByLabelText("교사 접근 비밀번호"), "teacher-secret");
  await user.click(screen.getByRole("button", { name: "시간표 분석" }));
  await screen.findByDisplayValue(rows[0].activity);
  return { file, user };
}

describe("CreativeActivityGenerator", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse({ activities: parsedRows, warnings: [] })));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:creative-csv"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("accepts one supported file by picker or drop, rejects unsupported files, and removes the file", async () => {
    const user = userEvent.setup();
    render(<CreativeActivityGenerator />);

    const input = screen.getByLabelText("연간시간표 파일");
    expect(input).toHaveAttribute("accept", ".hwp,.hwpx,.pdf");
    await user.upload(input, new File(["pdf"], "annual.pdf", { type: "application/pdf" }));
    expect(screen.getByText("annual.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "연간시간표 파일 삭제" }));
    expect(screen.queryByText("annual.pdf")).not.toBeInTheDocument();

    fireEvent.drop(screen.getByTestId("연간시간표 드롭존"), {
      dataTransfer: { files: [new File(["hwp"], "annual.hwp")] },
    });
    expect(screen.getByText("annual.hwp")).toBeInTheDocument();

    fireEvent.drop(screen.getByTestId("연간시간표 드롭존"), {
      dataTransfer: { files: [new File(["txt"], "annual.txt")] },
    });
    expect(screen.getByText("HWP, HWPX, PDF 파일만 사용할 수 있습니다.")).toBeInTheDocument();
    expect(screen.getByText("annual.hwp")).toBeInTheDocument();
  });

  it("sends only the file and password as multipart data and keeps same-date activities separate", async () => {
    render(<CreativeActivityGenerator />);
    const { file } = await uploadAndAnalyze();

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/creative-activities/parse");
    expect(init?.method).toBe("POST");
    const form = init?.body as FormData;
    expect([...form.keys()]).toEqual(["file", "password", "semester"]);
    expect(form.get("file")).toBe(file);
    expect(form.get("password")).toBe("teacher-secret");
    expect(form.get("semester")).toBe("1");
    expect(screen.getByLabelText("분석 학기")).toHaveValue("1");
    expect(screen.getAllByDisplayValue("3/12")).toHaveLength(2);
    expect(screen.getByRole("table", { name: "창체 활동 및 평어" })).toBeInTheDocument();
  });

  it("selects all rows and clears the full selection from the table header", async () => {
    render(<CreativeActivityGenerator />);
    const { user } = await uploadAndAnalyze();

    const headerSelection = screen.getByRole("checkbox", { name: "창체 전체 활동 선택" });
    await user.click(headerSelection);
    expect(screen.getByLabelText("1행 선택")).toBeChecked();
    expect(screen.getByLabelText("2행 선택")).toBeChecked();

    await user.click(headerSelection);
    expect(screen.getByLabelText("1행 선택")).not.toBeChecked();
    expect(screen.getByLabelText("2행 선택")).not.toBeChecked();
    expect(screen.getByLabelText("1행 활동")).toHaveValue(parsedRows[0].activity);
    expect(screen.getByLabelText("2행 활동")).toHaveValue(parsedRows[1].activity);
  });

  it("removes separate selection and review groups while keeping generation distinct", async () => {
    render(<CreativeActivityGenerator />);
    await uploadAndAnalyze();

    const generation = screen.getByRole("group", { name: "평어 생성" });
    const results = screen.getByRole("group", { name: "결과 관리" });

    expect(generation.compareDocumentPosition(results) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(generation).getByRole("button", { name: "전체 평어 생성" })).toHaveClass("button-primary");
    expect(screen.queryByRole("group", { name: "선택 관리" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "검토 관리" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "확인 상태" })).not.toBeInTheDocument();
  });

  it("uses only the more specific overlapping activity in the generation request", async () => {
    const overlappingRow = {
      ...parsedRows[0],
      activity: "학교폭력예방교육, 사이버 학교 폭력 교육",
    };
    vi.mocked(fetch)
      .mockImplementationOnce(() => jsonResponse({ activities: [overlappingRow], warnings: [] }))
      .mockImplementationOnce(() => jsonResponse({
        rows: [{ id: overlappingRow.id, comment: "사이버 학교 폭력의 특징과 예방 방법을 이해함." }],
      }));
    render(<CreativeActivityGenerator />);
    const { user } = await uploadAndAnalyze([overlappingRow]);

    await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));
    await screen.findByDisplayValue("사이버 학교 폭력의 특징과 예방 방법을 이해함.");

    const request = JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body));
    expect(request.rows[0].activity).toBe("사이버 학교 폭력 교육");
    expect(screen.getByLabelText("1행 활동")).toHaveValue(overlappingRow.activity);
  });

  it("blocks invalid rows and generates immediately after their values become valid", async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(() => jsonResponse({
        activities: [{ ...parsedRows[0], date: "확인 필요", needsReview: true }],
        warnings: [],
      }))
      .mockImplementationOnce(() => jsonResponse({ rows: [{ id: "activity-1", comment: "약속을 함께 정함." }] }));
    render(<CreativeActivityGenerator />);
    const { user } = await uploadAndAnalyze([{ ...parsedRows[0], date: "확인 필요", needsReview: true }]);

    await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/날짜는 실제 달력의 M\/D 형식/)).toBeInTheDocument();

    const date = screen.getByLabelText("1행 날짜");
    await user.clear(date);
    await user.type(date, "02/29");
    await user.clear(screen.getByLabelText("1행 시수"));
    await user.type(screen.getByLabelText("1행 시수"), "3");
    await user.selectOptions(screen.getByLabelText("1행 구분"), "진로");
    await user.clear(screen.getByLabelText("1행 활동"));
    await user.type(screen.getByLabelText("1행 활동"), "나의 강점 살펴보기");
    await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));
    await screen.findByDisplayValue("약속을 함께 정함.");
    const request = JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body));
    expect(request).toEqual({
      password: "teacher-secret",
      rows: [{
        id: "activity-1",
        date: "02/29",
        category: "진로",
        activity: "나의 강점 살펴보기",
        hours: 3,
      }],
    });
  }, 10_000);

  it("explains invalid row values without a separate confirmation action", async () => {
    vi.mocked(fetch).mockImplementationOnce(() => jsonResponse({
      activities: [{ ...parsedRows[0], date: "2/30", hours: 9, needsReview: true }],
      warnings: [],
    }));
    render(<CreativeActivityGenerator />);
    const { user } = await uploadAndAnalyze([{ ...parsedRows[0], date: "2/30", hours: 9, needsReview: true }]);

    await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));
    expect(screen.getByText(/날짜는 실제 달력의 M\/D 형식.*시수는 1~8/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "확인 완료" })).not.toBeInTheDocument();
  });

  it("renders each generated comment beside its extracted activity in the review table", async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(() => jsonResponse({ activities: parsedRows, warnings: [] }))
      .mockImplementationOnce(() => jsonResponse({ rows: [
        { id: "activity-1", comment: "학급 약속을 책임감 있게 실천함." },
        { id: "activity-2", comment: "교실 정리에 적극적으로 참여함." },
      ] }));
    render(<CreativeActivityGenerator />);
    const { user } = await uploadAndAnalyze();
    await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));

    const review = screen.getByRole("table", { name: "창체 활동 및 평어" });
    expect(within(review).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "선택", "날짜", "시수", "구분", "추출한 활동", "평어",
    ]);
    expect(within(review).getByLabelText("1행 평어")).toHaveValue("학급 약속을 책임감 있게 실천함.");
    expect(within(review).getByLabelText("2행 평어")).toHaveValue("교실 정리에 적극적으로 참여함.");
    expect(screen.queryByRole("table", { name: "창체 평어 결과" })).not.toBeInTheDocument();
  });

  it("uses a teacher-edited confirmed activity immediately when generating a new comment", async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(() => jsonResponse({ activities: [parsedRows[0]], warnings: [] }))
      .mockImplementationOnce(() => jsonResponse({
        rows: [{ id: "activity-1", comment: "단소 연주 방법을 익히고 우리 음악의 특징을 이해함." }],
      }));
    render(<CreativeActivityGenerator />);
    const { user } = await uploadAndAnalyze([parsedRows[0]]);

    const activity = screen.getByLabelText("1행 활동");
    await user.clear(activity);
    await user.type(activity, "단소 배우기 국악교육");
    await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));

    expect(await screen.findByDisplayValue("단소 연주 방법을 익히고 우리 음악의 특징을 이해함.")).toBeInTheDocument();
    const request = JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body));
    expect(request.rows[0].activity).toBe("단소 배우기 국악교육");
    expect(screen.queryByText(/확인 완료가 필요한 활동/)).not.toBeInTheDocument();
  });

  it("splits more than 50 activities into valid generation requests and applies results only after all batches finish", async () => {
    const manyRows = Array.from({ length: 51 }, (_, index) => ({
      ...parsedRows[0],
      id: `activity-${index + 1}`,
      activity: `creative activity ${index + 1}`,
    }));
    const commentsFor = (rows: typeof manyRows) => rows.map(({ id }) => ({ id, comment: `${id} comment` }));
    vi.mocked(fetch)
      .mockImplementationOnce(() => jsonResponse({ activities: manyRows, warnings: [] }))
      .mockImplementationOnce(() => jsonResponse({ rows: commentsFor(manyRows.slice(0, 50)) }))
      .mockImplementationOnce(() => jsonResponse({ rows: commentsFor(manyRows.slice(50)) }));

    render(<CreativeActivityGenerator />);
    const { user } = await uploadAndAnalyze(manyRows);
    await user.click(screen.getByRole("button", { name: /\uC804\uCCB4 \uD3C9\uC5B4 \uC0DD\uC131/u }));

    expect(await screen.findByDisplayValue("activity-51 comment")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(3);
    const firstGenerationBody = JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body));
    const secondGenerationBody = JSON.parse(String(vi.mocked(fetch).mock.calls[2][1]?.body));
    expect(firstGenerationBody.rows).toHaveLength(50);
    expect(secondGenerationBody.rows).toHaveLength(1);
    expect(screen.getByText(/51.*\uD3C9\uC5B4.*\uC0DD\uC131/u)).toBeInTheDocument();
  });

  it("does not partially apply comments when a requested id is missing and safely ignores unknown ids", async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(() => jsonResponse({ activities: parsedRows, warnings: [] }))
      .mockImplementationOnce(() => jsonResponse({ rows: [
        { id: "activity-1", comment: "부분 결과" },
        { id: "unknown", comment: "알 수 없는 결과" },
      ] }));
    const view = render(<CreativeActivityGenerator />);
    let user = (await uploadAndAnalyze()).user;
    await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));
    expect(await screen.findByText(/일부 활동의 평어가 누락/)).toBeInTheDocument();
    expect(screen.queryByDisplayValue("부분 결과")).not.toBeInTheDocument();
    expect(screen.queryByText("알 수 없는 결과")).not.toBeInTheDocument();

    view.unmount();
    vi.mocked(fetch)
      .mockReset()
      .mockImplementationOnce(() => jsonResponse({ activities: [parsedRows[0]], warnings: [] }))
      .mockImplementationOnce(() => jsonResponse({ rows: [
        { id: "unknown", comment: "무시할 결과" },
        { id: "activity-1", comment: "정상 결과" },
      ] }));
    render(<CreativeActivityGenerator />);
    user = (await uploadAndAnalyze([parsedRows[0]])).user;
    await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));
    expect(await screen.findByDisplayValue("정상 결과")).toBeInTheDocument();
    expect(screen.queryByText("무시할 결과")).not.toBeInTheDocument();
  });

  it("edits comments directly and supports adding, selecting, deleting, and resetting rows", async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(() => jsonResponse({ activities: [parsedRows[0]], warnings: [] }))
      .mockImplementationOnce(() => jsonResponse({ rows: [{ id: "activity-1", comment: "생성 평어" }] }));
    render(<CreativeActivityGenerator />);
    const { user } = await uploadAndAnalyze([parsedRows[0]]);
    await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));
    const comment = await screen.findByLabelText("1행 평어");
    await user.clear(comment);
    await user.type(comment, "교사가 다듬은 평어");
    expect(comment).toHaveValue("교사가 다듬은 평어");

    await user.click(screen.getByRole("button", { name: "행 추가" }));
    expect(screen.getByLabelText("2행 날짜")).toHaveValue("");
    expect(screen.getByLabelText("2행 시수")).toHaveValue(1);
    expect(screen.getByLabelText("2행 구분")).toHaveValue("자율");
    expect(screen.getByLabelText("2행 선택")).toBeChecked();
    await user.click(screen.getByRole("button", { name: "선택 삭제" }));
    expect(screen.queryByLabelText("2행 날짜")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "초기화" }));
    expect(screen.queryByRole("table", { name: "창체 활동 및 평어" })).not.toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "창체 평어 결과" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("교사 접근 비밀번호")).toHaveValue("");
    expect(screen.queryByText("annual.pdf")).not.toBeInTheDocument();
  });

  it("copies results and downloads CSV and a valid HWPX document", async () => {
    const comments = [
      { id: "activity-1", comment: "쉼표, 포함 평어" },
      { id: "activity-2", comment: "따옴표 \"포함\" 평어" },
    ];
    vi.mocked(fetch)
      .mockImplementationOnce(() => jsonResponse({ activities: parsedRows, warnings: [] }))
      .mockImplementationOnce(() => jsonResponse({ rows: comments }));
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    let capturedBlob: Blob | undefined;
    let objectUrlSequence = 0;
    vi.mocked(URL.createObjectURL).mockImplementation((blob) => {
      capturedBlob = blob as Blob;
      objectUrlSequence += 1;
      return objectUrlSequence === 1 ? "blob:creative-csv" : "blob:creative-hwpx";
    });
    render(<CreativeActivityGenerator />);
    const { user } = await uploadAndAnalyze();
    await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));
    await screen.findByDisplayValue(comments[0].comment);

    await user.click(screen.getByRole("button", { name: "결과 복사" }));
    expect(await navigator.clipboard.readText()).toBe(
      "날짜\t평어\n3/12\t쉼표, 포함 평어\n3/12\t따옴표 \"포함\" 평어",
    );

    await user.click(screen.getByRole("button", { name: "CSV 다운로드" }));
    expect(anchorClick).toHaveBeenCalledOnce();
    const anchor = anchorClick.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("창의적체험활동-평어.csv");
    const csvBytes = await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(capturedBlob!);
    });
    expect([...csvBytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(csvBytes.slice(3))).toBe(
      '날짜,평어\n"3/12","쉼표, 포함 평어"\n"3/12","따옴표 ""포함"" 평어"',
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:creative-csv");

    const editedComment = "교사가 문법과 내용을 직접 다듬은 최종 평어임.";
    const firstComment = screen.getByLabelText("1행 평어");
    await user.clear(firstComment);
    await user.type(firstComment, editedComment);
    await user.click(screen.getByRole("button", { name: "한글 파일 다운로드" }));
    await waitFor(() => expect(anchorClick).toHaveBeenCalledTimes(2));
    const hwpxAnchor = anchorClick.mock.instances[1] as HTMLAnchorElement;
    expect(document.body.contains(hwpxAnchor)).toBe(false);
    expect(hwpxAnchor.download).toBe("창의적체험활동-평어.hwpx");
    expect(capturedBlob?.type).toBe("application/vnd.hancom.hwpx");
    const hwpxBytes = await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(capturedBlob!);
    });
    expect([...hwpxBytes.slice(0, 2)]).toEqual([0x50, 0x4b]);
    const reader = new HwpxReader();
    const hwpxCopy = new Uint8Array(hwpxBytes);
    await reader.loadFromArrayBuffer(hwpxCopy.buffer);
    expect(await reader.extractText()).toContain(editedComment);
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:creative-hwpx");
    expect(screen.getByText(
      "한글 HWPX 파일을 내려받았습니다. 다운로드 폴더에서 한컴오피스 한글로 열어주세요.",
    )).toBeInTheDocument();
  });

  it("does not persist private data and does not show empty review or result tables initially", async () => {
    render(<CreativeActivityGenerator />);
    expect(screen.getByText(/원본 파일과 전체 추출 텍스트는.*저장하지 않습니다/)).toBeInTheDocument();
    expect(screen.getByText(/분석 결과를 확인한 뒤 평어를 생성/)).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "창체 활동 및 평어" })).not.toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "창체 평어 결과" })).not.toBeInTheDocument();

    await uploadAndAnalyze([parsedRows[0]]);
    expect(JSON.stringify(localStorage)).not.toContain("teacher-secret");
    expect(JSON.stringify(sessionStorage)).not.toContain("teacher-secret");
    expect(JSON.stringify(localStorage)).not.toContain("private raw timetable");
    expect(JSON.stringify(sessionStorage)).not.toContain("private raw timetable");
  });

  it("disables repeated work while busy and displays only the API error message", async () => {
    let resolveParse!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise((resolve) => { resolveParse = resolve; }));
    render(<CreativeActivityGenerator />);
    const user = userEvent.setup();
    await user.upload(screen.getByLabelText("연간시간표 파일"), new File(["pdf"], "annual.pdf"));
    await user.type(screen.getByLabelText("교사 접근 비밀번호"), "secret");
    await user.click(screen.getByRole("button", { name: "시간표 분석" }));
    expect(screen.getByRole("button", { name: "분석 중…" })).toBeDisabled();
    expect(screen.getByText("시간표를 분석하고 있습니다.")).toBeInTheDocument();
    resolveParse({
      ok: false,
      json: () => Promise.resolve({ message: "분석 권한이 없습니다.", raw: "PRIVATE RAW PAYLOAD" }),
    } as Response);
    expect(await screen.findByText("분석 권한이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByText(/PRIVATE RAW PAYLOAD/)).not.toBeInTheDocument();

    vi.mocked(fetch)
      .mockReset()
      .mockImplementationOnce(() => jsonResponse({ activities: [parsedRows[0]], warnings: [] }))
      .mockImplementationOnce(() => jsonResponse({ message: "생성 한도를 확인해 주세요.", raw: "RAW" }, false));
    await user.click(screen.getByRole("button", { name: "시간표 분석" }));
    await screen.findByDisplayValue(parsedRows[0].activity);
    await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));
    expect(await screen.findByText("생성 한도를 확인해 주세요.")).toBeInTheDocument();
    expect(screen.queryByText("RAW")).not.toBeInTheDocument();
  });
});
