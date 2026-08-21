import { describe, expect, it, vi } from "vitest";

import { handleCreateSavedReport, handleListSavedReports } from "@/app/api/saved-reports/handler";
import { handleDeleteSavedReport, handleGetSavedReport } from "@/app/api/saved-reports/[id]/handler";

const activeAccess = vi.fn().mockResolvedValue({
  ok: true,
  userId: "user-1",
  email: "teacher@example.com",
  role: "teacher",
} as const);

const savedReport = {
  id: "report-1",
  userId: "user-1",
  title: "2026 5학년 2반 사회",
  subject: "사회",
  schoolYear: "2026",
  semester: "1학기",
  grade: "5학년",
  className: "2반",
  createdAt: new Date("2026-07-09T00:00:00.000Z"),
  updatedAt: new Date("2026-07-09T00:00:00.000Z"),
  rows: [
    {
      id: "row-1",
      savedReportId: "report-1",
      studentNumber: 1,
      anonymousName: "1번 학생",
      subject: "사회",
      areaLevels: [{ areaName: "지리 인식", level: "잘함" }],
      selectedAreas: ["지리 인식"],
      comment: "우리나라 지형의 특징을 이해하고 자료를 바탕으로 설명함.",
      createdAt: new Date("2026-07-09T00:00:00.000Z"),
      updatedAt: new Date("2026-07-09T00:00:00.000Z"),
    },
  ],
};

describe("saved report APIs", () => {
  it("rejects unauthenticated or unapproved users before listing reports", async () => {
    const response = await handleListSavedReports({
      requireActiveSubscription: vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        code: "AUTH_REQUIRED",
        message: "로그인 후 이용할 수 있습니다.",
      }),
      listReports: vi.fn(),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "AUTH_REQUIRED" });
  });

  it("lists only the current user's saved report summaries", async () => {
    const listReports = vi.fn().mockResolvedValue([{ ...savedReport, rows: [] }]);

    const response = await handleListSavedReports({
      requireActiveSubscription: activeAccess,
      listReports,
    });

    expect(listReports).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reports: [
        {
          id: "report-1",
          title: "2026 5학년 2반 사회",
          subject: "사회",
          schoolYear: "2026",
          semester: "1학기",
          grade: "5학년",
          className: "2반",
          createdAt: "2026-07-09T00:00:00.000Z",
          updatedAt: "2026-07-09T00:00:00.000Z",
        },
      ],
    });
  });

  it("creates an anonymized saved report and ignores real student names", async () => {
    const createReport = vi.fn().mockResolvedValue(savedReport);
    const request = new Request("http://localhost/api/saved-reports", {
      method: "POST",
      body: JSON.stringify({
        title: "2026 5학년 2반 사회",
        subject: "사회",
        schoolYear: "2026",
        semester: "1학기",
        grade: "5학년",
        className: "2반",
        rows: [
          {
            studentNumber: 1,
            name: "김대한",
            anonymousName: "1번 학생",
            subject: "사회",
            areaLevels: [{ areaName: "지리 인식", level: "잘함" }],
            selectedAreas: ["지리 인식"],
            comment: "우리나라 지형의 특징을 이해하고 자료를 바탕으로 설명함.",
          },
        ],
      }),
    });

    const response = await handleCreateSavedReport(request, {
      requireActiveSubscription: activeAccess,
      createReport,
    });

    expect(response.status).toBe(201);
    expect(createReport).toHaveBeenCalledWith("user-1", expect.objectContaining({
      rows: [
        expect.not.objectContaining({ name: "김대한" }),
      ],
    }));
    expect(JSON.stringify(await response.json())).not.toContain("김대한");
  });

  it("gets a report only when it belongs to the current user", async () => {
    const getReport = vi.fn().mockResolvedValue(savedReport);
    const response = await handleGetSavedReport(
      new Request("http://localhost/api/saved-reports/report-1"),
      { params: Promise.resolve({ id: "report-1" }) },
      { requireActiveSubscription: activeAccess, getReport },
    );

    expect(getReport).toHaveBeenCalledWith("user-1", "report-1");
    expect(response.status).toBe(200);
    expect(JSON.stringify(await response.json())).not.toContain("김대한");
  });

  it("deletes a report only when it belongs to the current user", async () => {
    const deleteReport = vi.fn().mockResolvedValue(undefined);
    const response = await handleDeleteSavedReport(
      new Request("http://localhost/api/saved-reports/report-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "report-1" }) },
      { requireActiveSubscription: activeAccess, deleteReport },
    );

    expect(deleteReport).toHaveBeenCalledWith("user-1", "report-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
