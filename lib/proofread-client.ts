export type ProofreadClientRow = { id: string; comment: string };

type ProofreadInBatchesInput = {
  password: string;
  rows: ProofreadClientRow[];
  onProgress?: (completed: number, total: number) => void;
  fetcher?: typeof fetch;
};

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { message?: unknown };
    if (typeof body.message === "string" && body.message.trim()) return body.message;
  } catch {
    // Fall through to the safe message.
  }
  return "맞춤법 검사 요청에 실패했습니다.";
}

export async function proofreadInBatches({
  password,
  rows,
  onProgress,
  fetcher = fetch,
}: ProofreadInBatchesInput): Promise<ProofreadClientRow[]> {
  const corrected = new Map<string, string>();

  for (let offset = 0; offset < rows.length; offset += 50) {
    const batch = rows.slice(offset, offset + 50);
    const response = await fetcher("/api/proofread", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password, rows: batch.map(({ id, comment }) => ({ id, comment })) }),
    });
    if (!response.ok) throw new Error(await errorMessage(response));

    const data = await response.json() as { rows?: Array<{ id?: unknown; comment?: unknown }> };
    const batchIds = new Set(batch.map((row) => row.id));
    const returnedRows = Array.isArray(data.rows) ? data.rows : [];
    for (const row of returnedRows) {
      if (typeof row.id === "string" && typeof row.comment === "string" && batchIds.has(row.id)) {
        corrected.set(row.id, row.comment);
      }
    }
    if (batch.some((row) => !corrected.has(row.id))) {
      throw new Error("일부 맞춤법 검사 결과가 누락되었습니다.");
    }
    onProgress?.(Math.min(offset + batch.length, rows.length), rows.length);
  }

  return rows.map((row) => ({ id: row.id, comment: corrected.get(row.id) ?? row.comment }));
}
