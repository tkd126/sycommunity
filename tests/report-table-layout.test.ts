import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("교과 결과표 레이아웃", () => {
  it("데스크톱 작업영역 너비 안에서 줄바꿈하며 가로 스크롤을 강제하지 않는다", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

    expect(css).toMatch(/\.student-table--subject-result\s*\{[\s\S]*?width:\s*100%/);
    expect(css).not.toMatch(/\.student-table--subject-result\s*\{[\s\S]*?width:\s*max-content/);
    expect(css).toMatch(/\.student-table--subject-result\s+\.col-comment\s*\{[\s\S]*?width:\s*auto/);
    expect(css).toMatch(/\.student-table--subject-result\s+\.col-area-level\s*\{[^}]*width:\s*104px/);
    expect(css).toMatch(/\.student-table--subject-result\s+\.col-comment\s*\{[^}]*min-width:\s*220px/);
  });

  it("동아리 익명 이름을 온전히 표시하고 기록 칸에 충분한 너비를 배분한다", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

    expect(css).toMatch(/\.club-table\s+\.col-name\s*\{[^}]*width:\s*124px/);
    expect(css).toMatch(/\.club-table\s+\.col-club-record\s*\{[^}]*width:\s*auto/);
  });

  it("좁은 화면에서는 사이드바를 접고 본문 전체의 가로 잘림을 막는다", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

    expect(css).toMatch(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.sidebar\s*\{[^}]*width:\s*64px/);
    expect(css).toMatch(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.report-page\s*\{[^}]*min-width:\s*0/);
    expect(css).toMatch(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.workspace\s*\{[^}]*overflow-x:\s*hidden/);
  });
});
