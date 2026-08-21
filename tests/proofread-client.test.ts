import { describe, expect, it, vi } from "vitest";

import { proofreadInBatches } from "@/lib/proofread-client";

function response(rows: Array<{ id: string; comment: string }>) {
  return Promise.resolve(new Response(JSON.stringify({ rows }), { status: 200 }));
}

describe("proofreadInBatches", () => {
  it("sends only id and comment in batches of at most 50 and reports progress", async () => {
    const rows = Array.from({ length: 51 }, (_, index) => ({ id: `row-${index + 1}`, comment: `문장 ${index + 1}` }));
    const fetcher = vi.fn()
      .mockImplementationOnce((_url, init: RequestInit) => {
        const body = JSON.parse(String(init.body));
        return response(body.rows.map((row: { id: string }) => ({ id: row.id, comment: `${row.id} 교정함.` })));
      })
      .mockImplementationOnce((_url, init: RequestInit) => {
        const body = JSON.parse(String(init.body));
        return response(body.rows.map((row: { id: string }) => ({ id: row.id, comment: `${row.id} 교정함.` })));
      });
    const progress = vi.fn();

    const result = await proofreadInBatches({ password: "secret", rows, onProgress: progress, fetcher });

    expect(fetcher).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(String(fetcher.mock.calls[0][1].body));
    const secondBody = JSON.parse(String(fetcher.mock.calls[1][1].body));
    expect(firstBody.rows).toHaveLength(50);
    expect(secondBody.rows).toHaveLength(1);
    expect(Object.keys(firstBody.rows[0]).sort()).toEqual(["comment", "id"]);
    expect(JSON.stringify(firstBody)).not.toContain("name");
    expect(JSON.stringify(firstBody)).not.toContain("studentNumber");
    expect(JSON.stringify(firstBody)).not.toContain("activity");
    expect(result).toHaveLength(51);
    expect(progress).toHaveBeenLastCalledWith(51, 51);
  });

  it("does not return partial corrections when a response id is missing", async () => {
    const rows = [{ id: "row-1", comment: "첫 문장" }, { id: "row-2", comment: "둘째 문장" }];
    await expect(proofreadInBatches({
      password: "secret",
      rows,
      fetcher: vi.fn(() => response([{ id: "row-1", comment: "첫 문장 교정함." }])),
    })).rejects.toThrow("일부 맞춤법 검사 결과가 누락되었습니다");
  });

  it("uses the safe API message when a request fails", async () => {
    await expect(proofreadInBatches({
      password: "secret",
      rows: [{ id: "row-1", comment: "문장" }],
      fetcher: vi.fn(() => Promise.resolve(new Response(JSON.stringify({ message: "이번 달 사용 한도에 도달했습니다." }), { status: 429 }))),
    })).rejects.toThrow("이번 달 사용 한도에 도달했습니다");
  });
});
