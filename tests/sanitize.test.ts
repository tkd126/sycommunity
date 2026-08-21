import { describe, expect, it } from "vitest";

import { findCommentViolations, sanitizeComment } from "@/lib/sanitize";

describe("sanitizeComment", () => {
  it("제품명과 부정적 표현을 교육적인 표현으로 바꾼다", () => {
    expect(sanitizeComment("학생은 레고를 잘하지 못함."))
      .toBe("블록 장난감을 활용하며 해결 방법을 익혀 가고 있음.");
  });

  it("외국어와 허용하지 않는 특수문자를 제거한다", () => {
    expect(sanitizeComment("Scratch 활동★에 참여함!"))
      .toBe("활동에 참여함");
  });

  it("남아 있는 금지어를 찾는다", () => {
    expect(findCommentViolations("모범생으로서 활동함")).toContain("모범생");
  });
});
