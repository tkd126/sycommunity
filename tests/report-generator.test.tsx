import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ReportGenerator } from "@/components/ReportGenerator";

async function fillRequiredInputs() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("평가 계획"), "읽기와 쓰기 평가 계획");
  await user.type(screen.getByLabelText("교사 접근 비밀번호"), "teacher-password");
  return user;
}

describe("ReportGenerator", () => {
  it("초기 조회 조건과 다섯 명의 학생을 표시한다", () => {
    render(<ReportGenerator />);

    expect(screen.getByRole("heading", { name: "학기말종합의견" })).toBeInTheDocument();
    expect(screen.getByText("Total 5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("김하늘")).toBeInTheDocument();
    expect(screen.getByDisplayValue("정시우")).toBeInTheDocument();
  });

  it("비밀번호가 없으면 생성하지 않고 입력 안내를 표시한다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("평가 계획"), "국어 평가 계획");
    await user.click(screen.getByRole("button", { name: "전체 학생 생성" }));

    expect(screen.getByRole("status")).toHaveTextContent("교사 접근 비밀번호를 입력해 주세요");
    expect(screen.getByLabelText("김하늘 학기말 종합의견")).toHaveValue("");
  });

  it("전체 대상의 더미 평어를 생성하고 직접 수정할 수 있다", async () => {
    render(<ReportGenerator />);
    const user = await fillRequiredInputs();
    await user.click(screen.getByRole("button", { name: "전체 학생 생성" }));

    const comment = screen.getByLabelText("김하늘 학기말 종합의견");
    expect((comment as HTMLTextAreaElement).value).toContain("국어 교과에서");
    fireEvent.change(comment, { target: { value: "교사가 수정한 평어" } });
    expect(comment).toHaveValue("교사가 수정한 평어");
  });

  it("선택한 학생에게만 평어를 생성한다", async () => {
    render(<ReportGenerator />);
    const user = await fillRequiredInputs();
    await user.click(screen.getByLabelText("이가람 선택"));
    await user.click(screen.getByRole("button", { name: "선택 학생만 생성" }));

    expect(screen.getByLabelText("김하늘 학기말 종합의견")).toHaveValue("");
    expect((screen.getByLabelText("이가람 학기말 종합의견") as HTMLTextAreaElement).value).toContain("국어 교과에서");
  });

  it("기본 생성 버튼은 선택된 학생이 있으면 선택 학생만 생성한다", async () => {
    render(<ReportGenerator />);
    const user = await fillRequiredInputs();
    await user.click(screen.getByLabelText("이가람 선택"));
    await user.click(screen.getByRole("button", { name: "교과평어 생성" }));

    expect(screen.getByLabelText("김하늘 학기말 종합의견")).toHaveValue("");
    expect((screen.getByLabelText("이가람 학기말 종합의견") as HTMLTextAreaElement).value).toContain("국어 교과에서");
  });

  it("현재 표를 탭 구분 형식으로 클립보드에 복사한다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "결과 복사" }));

    const copied = await navigator.clipboard.readText();
    expect(copied).toContain("번호\t성명\t평가결과\t학기말 종합의견");
    expect(copied).toContain("1\t김하늘");
  });

  it("행을 추가하고 선택한 행을 삭제한다", async () => {
    render(<ReportGenerator />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "행 추가" }));
    expect(screen.getByText("Total 6")).toBeInTheDocument();

    const row = screen.getByLabelText("6번 학생 행");
    await user.type(within(row).getByLabelText("6번 성명"), "새학생");
    await user.click(within(row).getByLabelText("새학생 선택"));
    await user.click(screen.getByRole("button", { name: "선택 삭제" }));

    expect(screen.getByText("Total 5")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("새학생")).not.toBeInTheDocument();
  });
});
