import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FileDropzone } from "@/components/FileDropzone";

describe("FileDropzone", () => {
  it("파일 선택과 드롭을 같은 방식으로 전달한다", async () => {
    const onFiles = vi.fn();
    render(<FileDropzone label="평가 계획" accept=".pdf" onFiles={onFiles} />);
    const input = screen.getByLabelText("평가 계획 파일");
    const selected = new File(["one"], "계획.pdf", { type: "application/pdf" });
    await userEvent.upload(input, selected);
    expect(onFiles).toHaveBeenLastCalledWith([selected]);

    const dropped = new File(["two"], "계획2.pdf", { type: "application/pdf" });
    fireEvent.drop(screen.getByTestId("평가 계획 드롭존"), { dataTransfer: { files: [dropped] } });
    expect(onFiles).toHaveBeenLastCalledWith([dropped]);
  });

  it("드래그해서 올릴 수 있다는 안내를 표시한다", () => {
    render(<FileDropzone label="수행평가지" accept=".hwp,.pdf" multiple onFiles={() => undefined} />);
    expect(screen.getByText(/파일을 이곳에 끌어다 놓거나/)).toBeInTheDocument();
  });
});
