import { File as NodeFile } from "node:buffer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { extractDocumentText, extractAchievementPdf } = vi.hoisted(() => ({
  extractDocumentText: vi.fn(),
  extractAchievementPdf: vi.fn(),
}));

vi.mock("@/lib/document-extraction", () => ({ extractDocumentText, extractAchievementPdf }));

import { handleParseDocuments, handleParseDocumentsStream } from "@/app/api/parse-documents/handler";

class TestFormData {
  private readonly values = new Map<string, Array<string | NodeFile>>();

  append(key: string, value: string | NodeFile) {
    this.values.set(key, [...(this.values.get(key) ?? []), value]);
  }

  get(key: string) {
    return this.values.get(key)?.[0] ?? null;
  }

  getAll(key: string) {
    return this.values.get(key) ?? [];
  }
}

function requestFrom(form: TestFormData) {
  return { formData: async () => form as unknown as FormData } as Request;
}

function activeAccess() {
  return vi.fn().mockResolvedValue({
    ok: true,
    userId: "user-1",
    email: "teacher@example.com",
    role: "teacher",
  } as const);
}

function parseDocuments(form: TestFormData) {
  return handleParseDocuments(requestFrom(form), { requireActiveSubscription: activeAccess() });
}

describe("POST /api/parse-documents", () => {
  beforeEach(() => {
    extractDocumentText.mockReset();
    extractAchievementPdf.mockReset();
  });

  it("영역 PDF와 평가 계획 및 수행평가지를 동시에 읽어 전체 분석 시간을 줄인다", async () => {
    let active = 0;
    let maxActive = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const waitForRelease = async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await gate;
      active -= 1;
    };

    extractAchievementPdf.mockImplementation(async () => {
      await waitForRelease();
      return { text: "1 학생 문학 잘함", areaName: "문학" };
    });
    extractDocumentText.mockImplementation(async () => {
      await waitForRelease();
      return "참고 자료";
    });

    const form = new TestFormData();
    form.append("areas", JSON.stringify([{ areaId: "area-1", fileKey: "area-file-1" }]));
    form.append("area-file-1", new NodeFile(["area"], "문학.pdf", { type: "application/pdf" }));
    form.append("evaluationPlan", new NodeFile(["plan"], "평가계획.hwp"));
    form.append("worksheets", new NodeFile(["sheet"], "수행평가지.hwp"));

    const responsePromise = parseDocuments(form);
    await vi.waitFor(() => expect(active).toBeGreaterThan(0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    release();
    const response = await responsePromise;

    expect(response.status).toBe(200);
    expect(maxActive).toBe(3);
  });

  it("완료된 실제 파일 수에 따라 단조 증가하는 분석 진행률을 알린다", async () => {
    extractAchievementPdf.mockResolvedValue({ text: "1 학생 문학 잘함", areaName: "문학" });
    extractDocumentText.mockResolvedValue("참고 자료");
    const progress: Array<{ percent: number; completedFiles: number; totalFiles: number }> = [];
    const form = new TestFormData();
    form.append("areas", JSON.stringify([{ areaId: "area-1", fileKey: "area-file-1" }]));
    form.append("area-file-1", new NodeFile(["area"], "문학.pdf", { type: "application/pdf" }));
    form.append("evaluationPlan", new NodeFile(["plan"], "평가계획.hwp"));
    form.append("worksheets", new NodeFile(["sheet"], "수행평가지.hwp"));

    const response = await handleParseDocuments(requestFrom(form), {
      requireActiveSubscription: activeAccess(),
      reportProgress: (event) => progress.push(event),
    });

    expect(response.status).toBe(200);
    expect(progress[0]).toMatchObject({ percent: 5, completedFiles: 0, totalFiles: 3 });
    expect(progress.at(-1)).toMatchObject({ percent: 100, completedFiles: 3, totalFiles: 3 });
    expect(progress.map((event) => event.percent)).toEqual([...progress.map((event) => event.percent)].sort((a, b) => a - b));
    expect(progress.some((event) => event.completedFiles === 1)).toBe(true);
    expect(progress.some((event) => event.completedFiles === 2)).toBe(true);
  });

  it("NDJSON 응답에서 진행 사건 뒤에 최종 분석 결과를 전달한다", async () => {
    extractAchievementPdf.mockResolvedValue({ text: "1 학생 문학 잘함", areaName: "문학" });
    const form = new TestFormData();
    form.append("areas", JSON.stringify([{ areaId: "area-1", fileKey: "area-file-1" }]));
    form.append("area-file-1", new NodeFile(["area"], "문학.pdf", { type: "application/pdf" }));

    const response = handleParseDocumentsStream(requestFrom(form), {
      requireActiveSubscription: activeAccess(),
    });
    const events = (await response.text()).trim().split("\n").map((line) => JSON.parse(line));

    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    expect(events[0]).toMatchObject({ type: "progress", percent: 5, totalFiles: 1 });
    expect(events.at(-1)).toMatchObject({ type: "result", status: 200 });
    expect(events.at(-1).data.areas[0].areaName).toContain("문학");
  });

  it("승인된 사용자가 아니면 문서를 분석하지 않는다", async () => {
    const form = new TestFormData();
    form.append("areas", JSON.stringify([{ areaId: "area-1", fileKey: "area-file-1" }]));
    form.append("area-file-1", new NodeFile(["synthetic"], "문학.pdf", { type: "application/pdf" }));

    const response = await handleParseDocuments(requestFrom(form), {
      requireActiveSubscription: vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        code: "SUBSCRIPTION_REQUIRED",
        message: "관리자 승인 후 이용할 수 있습니다.",
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ code: "SUBSCRIPTION_REQUIRED" });
    expect(extractAchievementPdf).not.toHaveBeenCalled();
  });

  it("학생 이름을 응답에서 제거하고 영역명을 문서에서 자동 추출한다", async () => {
    extractAchievementPdf.mockResolvedValue({
      text: "1 김하늘 문학 매우잘함\n2 이가람 문학 잘함",
      areaName: "문학",
    });
    const form = new TestFormData();
    form.append("areas", JSON.stringify([{ areaId: "area-1", fileKey: "area-file-1" }]));
    form.append("area-file-1", new NodeFile(["synthetic"], "문학.pdf", { type: "application/pdf" }));

    const response = await parseDocuments(form);
    const body = await response.json();

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.areas[0].students[0]).toMatchObject({ studentNumber: 1, level: "매우 잘함" });
    expect(body.areas[0].areaName).toBe("문학");
    expect(body.areas[0].students[0]).not.toHaveProperty("name");
    expect(body.roster).toEqual([{ studentNumber: 1 }, { studentNumber: 2 }]);
    expect(JSON.stringify(body)).not.toContain("김하늘");
    expect(JSON.stringify(body)).not.toContain("이가람");
  });

  it("명렬표의 이름을 평가 계획과 수행평가지 본문에서도 제거한다", async () => {
    extractAchievementPdf.mockResolvedValue({
      text: "1 김하늘 문학 [6국4-05] 매우잘함",
      areaName: "문학",
    });
    extractDocumentText
      .mockResolvedValueOnce("김하늘의 국어 평가 계획")
      .mockResolvedValueOnce("김하늘 수행평가지");
    const form = new TestFormData();
    form.append("areas", JSON.stringify([{ areaId: "area-1", fileKey: "area-file-1" }]));
    form.append("area-file-1", new NodeFile(["area"], "문학.pdf", { type: "application/pdf" }));
    form.append("evaluationPlan", new NodeFile(["plan"], "계획.hwp"));
    form.append("worksheets", new NodeFile(["sheet"], "평가지.hwp"));

    const response = await parseDocuments(form);
    const body = await response.json();

    expect(JSON.stringify(body)).not.toContain("김하늘");
    expect(body.evaluationPlanText).toContain("국어 평가 계획");
    expect(body.worksheetText).toContain("수행평가지");
  });

  it("한 영역의 분석 실패가 다른 영역의 성공을 막지 않는다", async () => {
    extractAchievementPdf
      .mockResolvedValueOnce({ text: "1 김하늘 문학 매우잘함", areaName: "문학" })
      .mockRejectedValueOnce(new Error("문서를 읽지 못했습니다."));
    const form = new TestFormData();
    form.append("areas", JSON.stringify([
      { areaId: "area-1", fileKey: "area-file-1" },
      { areaId: "area-2", fileKey: "area-file-2" },
    ]));
    form.append("area-file-1", new NodeFile(["one"], "문학.pdf"));
    form.append("area-file-2", new NodeFile(["two"], "문법.pdf"));

    const response = await parseDocuments(form);
    const body = await response.json();

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.areas[0].students).toHaveLength(1);
    expect(body.areas[1].students).toEqual([]);
    expect(body.areas[1].warnings[0]).toContain("문서를 읽지 못했습니다.");
  });

  it("영역 파일은 10개를 넘으면 요청을 거부한다", async () => {
    const form = new TestFormData();
    form.append(
      "areas",
      JSON.stringify(
        Array.from({ length: 11 }, (_, index) => ({
          areaId: `area-${index}`,
          fileKey: `area-file-${index}`,
        })),
      ),
    );

    const response = await parseDocuments(form);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("TOO_MANY_AREA_FILES");
  });
});
