import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UsageBadge } from "@/components/UsageBadge";

describe("UsageBadge", () => {
  it("기본 사용량을 회색 상태로 표시한다", () => {
    render(<UsageBadge amountKrw={18420} budgetKrw={30000} />);
    expect(screen.getByText("이번 달 사용량")).toBeInTheDocument();
    expect(screen.getByText("18,420원")).toBeInTheDocument();
    expect(screen.getByTestId("usage-badge")).toHaveAttribute("data-status", "normal");
  });

  it("27000원 이상이면 주의 상태를 표시한다", () => {
    render(<UsageBadge amountKrw={27000} budgetKrw={30000} />);
    expect(screen.getByText("주의")).toBeInTheDocument();
    expect(screen.getByTestId("usage-badge")).toHaveAttribute("data-status", "warning");
  });

  it("한도 이상이면 사용 제한 상태를 표시한다", () => {
    render(<UsageBadge amountKrw={30000} budgetKrw={30000} />);
    expect(screen.getByText("사용 제한")).toBeInTheDocument();
    expect(screen.getByTestId("usage-badge")).toHaveAttribute("data-status", "limit");
  });
});
