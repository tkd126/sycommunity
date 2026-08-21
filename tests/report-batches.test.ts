import { describe, expect, it } from "vitest";

import { splitReportStudents } from "@/lib/report-batches";

describe("splitReportStudents", () => {
  it("12명 이하는 한 묶음으로 유지한다", () => {
    expect(splitReportStudents(Array.from({ length: 12 }, (_, index) => index + 1)))
      .toEqual([Array.from({ length: 12 }, (_, index) => index + 1)]);
  });

  it("27명은 14명과 13명 두 묶음으로 나눈다", () => {
    const batches = splitReportStudents(Array.from({ length: 27 }, (_, index) => index + 1));

    expect(batches.map((batch) => batch.length)).toEqual([14, 13]);
    expect(batches.flat()).toEqual(Array.from({ length: 27 }, (_, index) => index + 1));
  });
});
