import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClubActivityGenerator } from "@/components/ClubActivityGenerator";

describe("ClubActivityGenerator", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses student-level activity content without a separate writing settings panel", async () => {
    render(<ClubActivityGenerator />);
    const user = userEvent.setup();

    expect(screen.queryByText("작성 설정")).not.toBeInTheDocument();
    expect(screen.getByText(/단어, 짧은 메모, 활동 키워드만 입력해도 됩니다/)).toBeInTheDocument();

    await user.type(screen.getByLabelText("1번 동아리 활동 내용"), "레고 경복궁");
    await user.click(screen.getByRole("button", { name: "동아리 활동 기록 생성" }));

    expect(screen.getByDisplayValue("1번 학생")).toBeInTheDocument();
    const record = screen.getByLabelText("1번 동아리 활동 기록");
    expect((record as HTMLTextAreaElement).value).toMatch(/블록 모형.*건축물.*전시함\.$/);
    expect((record as HTMLTextAreaElement).value).not.toMatch(/꾸준|성실|끈기|노력/);
    expect(screen.queryByText("레고")).not.toBeInTheDocument();
  });

  it("restores activity input and generated records after remounting in the same tab", async () => {
    const user = userEvent.setup();
    const first = render(<ClubActivityGenerator />);

    await user.type(screen.getByLabelText("1번 동아리 활동 내용"), "레고 경복궁");
    await user.click(screen.getByRole("button", { name: "동아리 활동 기록 생성" }));
    first.unmount();

    render(<ClubActivityGenerator />);
    expect(screen.getByLabelText("1번 동아리 활동 내용")).toHaveValue("레고 경복궁");
    expect((screen.getByLabelText("1번 동아리 활동 기록") as HTMLTextAreaElement).value).toMatch(/전시함\.$/);
  });

  it("restores added rows and selection state after remounting", async () => {
    const user = userEvent.setup();
    const first = render(<ClubActivityGenerator />);

    await user.click(screen.getByRole("button", { name: "행 추가" }));
    await user.click(screen.getByLabelText("6번 선택"));
    first.unmount();

    render(<ClubActivityGenerator />);
    expect(screen.getByText("Total 6")).toBeInTheDocument();
    expect(screen.getByLabelText("6번 선택")).toBeChecked();
  });

  it("selects every row and then clears the full selection from the table header", async () => {
    render(<ClubActivityGenerator />);
    const user = userEvent.setup();

    const headerSelection = screen.getByRole("checkbox", { name: "동아리 전체 학생 선택" });
    await user.click(headerSelection);
    for (let number = 1; number <= 5; number += 1) {
      expect(screen.getByLabelText(`${number}번 선택`)).toBeChecked();
    }

    await user.click(headerSelection);
    for (let number = 1; number <= 5; number += 1) {
      expect(screen.getByLabelText(`${number}번 선택`)).not.toBeChecked();
    }
  });

  it("keeps one smart generation action and removes redundant selection controls", () => {
    render(<ClubActivityGenerator />);

    const generation = screen.getByRole("group", { name: "활동 기록 생성" });
    const results = screen.getByRole("group", { name: "결과 관리" });

    expect(generation.compareDocumentPosition(results) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(generation.querySelector(".button-primary")).toHaveTextContent("동아리 활동 기록 생성");
    expect(screen.queryByRole("button", { name: "선택 학생만 생성" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "전체 학생 생성" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "선택 관리" })).not.toBeInTheDocument();
  });

  it("removes the session and returns to five default rows when reset", async () => {
    const user = userEvent.setup();
    render(<ClubActivityGenerator />);

    await user.click(screen.getByRole("button", { name: "행 추가" }));
    expect(sessionStorage.getItem("student-record-helper:club:v1")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "초기화" }));
    expect(sessionStorage.getItem("student-record-helper:club:v1")).toBeNull();
    expect(screen.getByText("Total 5")).toBeInTheDocument();
  });

  it("discards a damaged session and starts with five default rows", () => {
    sessionStorage.setItem("student-record-helper:club:v1", "{damaged");

    render(<ClubActivityGenerator />);

    expect(screen.getByText("Total 5")).toBeInTheDocument();
    expect(screen.getByLabelText("1번 동아리 활동 내용")).toHaveValue("");
  });
  it("adjusts the student count while preserving existing leading rows", async () => {
    const user = userEvent.setup();
    render(<ClubActivityGenerator />);

    await user.type(screen.getByLabelText("1번 동아리 활동 내용"), "기존 활동");
    const countInput = screen.getByLabelText("학생 수");
    await user.clear(countInput);
    await user.type(countInput, "8");
    await user.click(screen.getByRole("button", { name: "학생 목록 만들기" }));

    expect(screen.getByText("Total 8")).toBeInTheDocument();
    expect(screen.getByLabelText("1번 동아리 활동 내용")).toHaveValue("기존 활동");
    expect(screen.getByLabelText("8번 동아리 활동 내용")).toBeInTheDocument();

    await user.clear(countInput);
    await user.type(countInput, "3");
    await user.click(screen.getByRole("button", { name: "학생 목록 만들기" }));

    expect(screen.getByText("Total 3")).toBeInTheDocument();
    expect(screen.getByLabelText("1번 동아리 활동 내용")).toHaveValue("기존 활동");
    expect(screen.queryByLabelText("4번 동아리 활동 내용")).not.toBeInTheDocument();
  });

  it("shows a per-student proofread status for unchanged and corrected records", async () => {
    const user = userEvent.setup();
    render(<ClubActivityGenerator />);

    await user.type(screen.getByLabelText("1번 동아리 활동 내용"), "춤 연습");
    await user.type(screen.getByLabelText("2번 동아리 활동 내용"), "점토 작품");
    await user.click(screen.getByRole("button", { name: "동아리 활동 기록 생성" }));
    await user.type(screen.getByLabelText("동아리 교사 접근 비밀번호"), "teacher-secret");

    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { rows: Array<{ id: string; comment: string }> };
      return new Response(JSON.stringify({
        rows: body.rows.map((row, index) => ({
          ...row,
          comment: index === 0 ? row.comment : `${row.comment} 문장을 수정함.`,
        })),
      }), { status: 200, headers: { "content-type": "application/json" } });
    }));

    await user.click(screen.getByRole("button", { name: "전체 결과 맞춤법 검사" }));

    expect(await screen.findByLabelText("1번 맞춤법 검사 상태")).toHaveTextContent("문제 없음");
    expect(screen.getByLabelText("2번 맞춤법 검사 상태")).toHaveTextContent("수정됨");

    await user.type(screen.getByLabelText("1번 동아리 활동 기록"), " 직접 수정");
    expect(screen.queryByLabelText("1번 맞춤법 검사 상태")).not.toBeInTheDocument();
  });
});
