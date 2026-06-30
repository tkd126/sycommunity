import type { ReactNode } from "react";

import { Sidebar } from "@/components/Sidebar";

const topMenus = ["교과평어", "동아리활동", "행동특성", "출결자료", "설정"];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__mark" aria-hidden="true">생</span>
          <strong>생기부 도우미</strong>
          <span>교사 업무 지원</span>
        </div>
        <nav aria-label="주요 업무" className="topbar__nav">
          {topMenus.map((menu, index) => (
            <button key={menu} type="button" className={index === 0 ? "topbar__tab topbar__tab--active" : "topbar__tab"}>
              {menu}
            </button>
          ))}
        </nav>
        <div className="topbar__user" aria-label="교사 전용">
          <span aria-hidden="true">●</span>
          교사 전용
        </div>
      </header>
      <div className="app-shell__body">
        <Sidebar />
        <main className="workspace">{children}</main>
      </div>
    </div>
  );
}
