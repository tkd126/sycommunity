import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CreativeActivityGenerator } from "@/components/CreativeActivityGenerator";

describe("CreativeActivityGenerator layout", () => {
  it("groups semester, password, analyze, and reset controls in a labeled analysis area", () => {
    render(<CreativeActivityGenerator />);

    const settings = screen.getByLabelText("시간표 분석 설정");
    expect(within(settings).getByText("분석 설정")).toBeInTheDocument();
    expect(within(settings).getByLabelText("분석 학기")).toBeInTheDocument();
    expect(within(settings).getByLabelText("교사 접근 비밀번호")).toBeInTheDocument();
    expect(within(settings).getByRole("button", { name: "시간표 분석" })).toHaveClass("creative-analyze-button");
    expect(within(settings).getByRole("button", { name: "초기화" })).toBeInTheDocument();
  });
});
