import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/AppShell";

describe("AppShell", () => {
  it("hides Settings from a teacher", () => {
    render(<AppShell showSettings={false}><div>teacher content</div></AppShell>);

    expect(screen.queryByRole("button", { name: "설정" })).not.toBeInTheDocument();
  });

  it("shows Settings to the configured administrator", () => {
    render(
      <AppShell showSettings settings={<div>administrator settings</div>}>
        <div>teacher content</div>
      </AppShell>,
    );

    expect(screen.getByRole("button", { name: "설정" })).toBeInTheDocument();
  });

  it("상단 업무 메뉴와 선택된 사이드바 메뉴를 표시한다", () => {
    render(<AppShell><div>업무 내용</div></AppShell>);

    expect(screen.getByText("생기부 도우미")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "주요 업무" })).toHaveTextContent("교과평어");
    expect(screen.getByRole("navigation", { name: "평가관리" })).toHaveTextContent("교과평어 작성기");
    expect(screen.getByText("업무 내용")).toBeInTheDocument();
  });

  it("출결자료 메뉴를 표시하지 않는다", () => {
    render(<AppShell><div>본문</div></AppShell>);

    expect(screen.queryByRole("button", { name: "출결자료" })).not.toBeInTheDocument();
  });

  it("동아리활동 탭을 누르면 동아리 화면을 보여준다", async () => {
    render(
      <AppShell club={<div>동아리 작성 화면</div>}>
        <div>교과 화면</div>
      </AppShell>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "동아리활동" }));

    expect(screen.getByText("동아리 작성 화면")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "동아리관리" })).toHaveTextContent("동아리 활동 기록 작성기");
  });

  it("창체활동 탭을 누르면 창체 평어 작성 화면을 보여준다", async () => {
    render(
      <AppShell creative={<div>창체 평어 작성 화면</div>}>
        <div>교과 화면</div>
      </AppShell>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "창체활동" }));

    expect(screen.getByText("창체 평어 작성 화면")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "창체관리" })).toHaveTextContent("창체 평어 작성기");
  });

  it("아직 구현되지 않은 사이드바 메뉴는 표시하지 않는다", async () => {
    render(
      <AppShell showSettings club={<div>동아리 화면</div>} settings={<div>설정 화면</div>}>
        <div>교과 화면</div>
      </AppShell>,
    );
    const user = userEvent.setup();

    expect(screen.queryByText("평가계획 관리")).not.toBeInTheDocument();
    expect(screen.queryByText("예시문 관리")).not.toBeInTheDocument();
    expect(screen.queryByText("사용량 관리")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "동아리활동" }));
    expect(screen.queryByText("활동 예시문 관리")).not.toBeInTheDocument();
    expect(screen.queryByText("저장본 관리")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "설정" }));
    expect(screen.queryByText("보안 설정")).not.toBeInTheDocument();
    expect(screen.queryByText("환경변수 점검")).not.toBeInTheDocument();
  });
});
