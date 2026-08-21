import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReportGenerator } from "@/components/ReportGenerator";

const AREA_NAMES = ["지리 인식", "법", "인문환경과 인간생활"];

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.endsWith("/api/usage")) {
    return new Response(JSON.stringify({ amountKrw: 1000, budgetKrw: 30000, status: "normal" }));
  }
  if (url.endsWith("/api/saved-reports") && !init) {
    return new Response(JSON.stringify({ reports: [] }));
  }
  if (url.endsWith("/api/parse-documents")) {
    return new Response(JSON.stringify({
      roster: [{ studentNumber: 1 }, { studentNumber: 2 }],
      areas: AREA_NAMES.map((areaName) => ({
        areaId: areaName,
        areaName,
        students: [
          { studentNumber: 1, level: "잘함", rawLevel: "잘함", confirmed: true },
          { studentNumber: 2, level: "보통", rawLevel: "보통", confirmed: true },
        ],
        warnings: [],
      })),
      evaluationPlanText: "",
      worksheetText: "",
      warnings: [],
    }));
  }
  if (url.endsWith("/api/saved-reports") && init?.method === "POST") {
    return new Response(JSON.stringify({
      report: {
        id: "report-1",
        title: "사회 저장본",
        subject: "사회",
        rows: [],
        createdAt: "2026-07-09T00:00:00.000Z",
        updatedAt: "2026-07-09T00:00:00.000Z",
      },
    }), { status: 201 });
  }
  throw new Error(`Unexpected fetch: ${url}`);
});

describe("ReportGenerator saved reports", () => {
  beforeEach(() => {
    sessionStorage.clear();
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("첫 화면에서는 저장본 목록을 요청하지 않고 선택 칸을 사용할 때 불러온다", async () => {
    render(<ReportGenerator />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/usage"));
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/api/saved-reports"))).toBe(false);

    screen.getByLabelText("저장본 선택").focus();
    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith("/api/saved-reports") && !init)).toBe(true);
    });
  });

  it("saves the current subject rows without sending real student names", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();

    await user.upload(
      screen.getByLabelText("영역별 평가결과 파일"),
      AREA_NAMES.map((name) => new File([name], `${name}.pdf`, { type: "application/pdf" })),
    );
    await user.click(screen.getByRole("button", { name: "첨부 자료 분석" }));
    await screen.findByText("Total 2");

    await user.click(screen.getByRole("button", { name: "저장하기" }));

    await waitFor(() => {
      const saveCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith("/api/saved-reports") && init?.method === "POST");
      expect(saveCall).toBeTruthy();
      expect(String(saveCall?.[1]?.body)).not.toContain("김");
      expect(String(saveCall?.[1]?.body)).toContain("1번 학생");
    });
  });
});
