import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClubActivityGenerator } from "@/components/ClubActivityGenerator";
import { CreativeActivityGenerator } from "@/components/CreativeActivityGenerator";
import { ReportGenerator } from "@/components/ReportGenerator";

function json(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
}

describe("whole-result proofreading UI", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("proofreads every generated club record and restores the previous text", async () => {
    const fetchMock = vi.fn((_url, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      return json({ rows: body.rows.map((row: { id: string }) => ({ id: row.id, comment: "교정된 동아리 기록임." })) });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ClubActivityGenerator />);
    await user.type(screen.getByLabelText("동아리 교사 접근 비밀번호"), "secret");
    await user.type(screen.getByLabelText("1번 동아리 활동 내용"), "블록 모형 만들기");
    await user.click(screen.getByRole("button", { name: "동아리 활동 기록 생성" }));
    const before = (screen.getByLabelText("1번 동아리 활동 기록") as HTMLTextAreaElement).value;

    await user.click(screen.getByRole("button", { name: "전체 결과 맞춤법 검사" }));
    expect(await screen.findByDisplayValue("교정된 동아리 기록임.")).toBeInTheDocument();
    const request = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(request.rows[0]).toEqual(expect.objectContaining({ comment: before }));
    expect(Object.keys(request.rows[0]).sort()).toEqual(["comment", "id"]);

    await user.click(screen.getByRole("button", { name: "검사 전으로 되돌리기" }));
    expect(screen.getByLabelText("1번 동아리 활동 기록")).toHaveValue(before);
  });

  it("proofreads creative comments after generation", async () => {
    const fetchMock = vi.fn((url, init?: RequestInit) => {
      if (String(url).endsWith("/parse")) return json({ activities: [{
        id: "activity-1", selected: false, date: "3/4", category: "자율",
        activity: "학교폭력예방교육", hours: 1, needsReview: false, comment: "",
      }], warnings: [] });
      if (String(url).endsWith("/generate")) return json({ rows: [{ id: "activity-1", comment: "예방 방법을 이해 하며 참여함." }] });
      const body = JSON.parse(String(init?.body));
      return json({ rows: body.rows.map((row: { id: string }) => ({ id: row.id, comment: "예방 방법을 이해하며 참여함." })) });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<CreativeActivityGenerator />);
    await user.upload(screen.getByLabelText("연간시간표 파일"), new File(["timetable"], "annual.pdf"));
    await user.type(screen.getByLabelText("교사 접근 비밀번호"), "secret");
    await user.click(screen.getByRole("button", { name: "시간표 분석" }));
    await screen.findByDisplayValue("학교폭력예방교육");
    await user.click(screen.getByRole("button", { name: "전체 평어 생성" }));
    await screen.findByDisplayValue("예방 방법을 이해 하며 참여함.");
    await user.click(screen.getByRole("button", { name: "전체 결과 맞춤법 검사" }));
    expect(await screen.findByDisplayValue("예방 방법을 이해하며 참여함.")).toBeInTheDocument();
  });

  it("proofreads subject comments without sending student identity or evidence", async () => {
    const areas = ["문학", "읽기", "쓰기"];
    const fetchMock = vi.fn((url, init?: RequestInit) => {
      if (String(url).endsWith("/api/usage")) return json({ amountKrw: 0, budgetKrw: 30_000, status: "normal" });
      if (String(url).endsWith("/api/parse-documents")) return json({
        roster: [{ studentNumber: 1 }],
        areas: areas.map((areaName, index) => ({
          areaId: `area-${index}`, areaName, warnings: [],
          students: [{ studentNumber: 1, level: "잘함", rawLevel: "잘함", confirmed: true }],
        })),
        evaluationPlanText: "평가 계획 원문", worksheetText: "수행평가지 원문", warnings: [],
      });
      if (String(url).endsWith("/api/generate-report")) return json({
        rows: [{ studentNumber: 1, selectedLevels: "문학 잘함", comment: "글의 내용을 이해 하고 설명함." }],
        usage: { amountKrw: 1, budgetKrw: 30_000 },
      });
      if (String(url).endsWith("/api/proofread")) {
        const body = JSON.parse(String(init?.body));
        return json({ rows: body.rows.map((row: { id: string }) => ({ id: row.id, comment: "글의 내용을 이해하고 설명함." })) });
      }
      throw new Error(`unexpected ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ReportGenerator />);
    await user.upload(screen.getByLabelText("영역별 평가결과 파일"), areas.map((area) => new File([area], `${area}.pdf`, { type: "application/pdf" })));
    await user.type(screen.getByLabelText("교사 접근 비밀번호"), "secret");
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));
    await screen.findByText("Total 1");
    await user.click(screen.getByRole("button", { name: "교과평어 생성" }));
    await screen.findByDisplayValue("글의 내용을 이해 하고 설명함.");
    await user.click(screen.getByRole("button", { name: "전체 결과 맞춤법 검사" }));
    expect(await screen.findByDisplayValue("글의 내용을 이해하고 설명함.")).toBeInTheDocument();

    const proofreadCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/api/proofread"));
    const bodyText = String(proofreadCall?.[1]?.body);
    expect(bodyText).not.toContain("1번 학생");
    expect(bodyText).not.toContain("studentNumber");
    expect(bodyText).not.toContain("평가 계획 원문");
    expect(bodyText).not.toContain("수행평가지 원문");
  }, 15_000);
});
