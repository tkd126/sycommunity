import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DocumentReviewPanel } from "@/components/DocumentReviewPanel";

describe("DocumentReviewPanel", () => {
  it("추출한 단계와 경고를 보여주고 단계를 수정할 수 있다", async () => {
    const onLevelChange = vi.fn();
    render(
      <DocumentReviewPanel
        roster={[{ studentNumber: 1 }, { studentNumber: 2 }]}
        areas={[
          {
            areaId: "area-1",
            areaName: "문학",
            students: [
              { studentNumber: 1, level: "매우 잘함", rawLevel: "매우잘함", confirmed: true },
              { studentNumber: 2, level: "", rawLevel: "참여함", confirmed: false },
            ],
            warnings: ["2번 단계 확인 필요"],
          },
        ]}
        onLevelChange={onLevelChange}
      />,
    );

    expect(screen.getByText("2번 단계 확인 필요")).toBeInTheDocument();
    expect(screen.getByText("1번 학생")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("문학 2번 성취 단계"), "잘함");
    expect(onLevelChange).toHaveBeenCalledWith("area-1", 2, "잘함");
  });
});
