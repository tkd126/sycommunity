import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/AppShell";

describe("AppShell", () => {
  it("상단 업무 메뉴와 선택된 사이드바 메뉴를 표시한다", () => {
    render(<AppShell><div>업무 내용</div></AppShell>);

    expect(screen.getByText("생기부 도우미")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "주요 업무" })).toHaveTextContent("교과평어");
    expect(screen.getByRole("navigation", { name: "평가관리" })).toHaveTextContent("교과평어 작성기");
    expect(screen.getByText("업무 내용")).toBeInTheDocument();
  });
});
