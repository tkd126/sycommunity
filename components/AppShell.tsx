"use client";

import { useState, type ReactNode } from "react";

import { Sidebar } from "@/components/Sidebar";

const topMenus = ["교과평어", "동아리활동", "창체활동", "설정"] as const;
type TopMenu = (typeof topMenus)[number];

type AppShellProps = {
  children: ReactNode;
  club?: ReactNode;
  creative?: ReactNode;
  settings?: ReactNode;
  showSettings?: boolean;
};

export function AppShell({ children, club, creative, settings, showSettings = false }: AppShellProps) {
  const [activeMenu, setActiveMenu] = useState<TopMenu>("교과평어");
  const visibleTopMenus: readonly TopMenu[] = showSettings
    ? topMenus
    : topMenus.filter((menu) => menu !== "설정");
  const visibleActiveMenu = visibleTopMenus.includes(activeMenu) ? activeMenu : topMenus[0];

  const content = (() => {
    if (visibleActiveMenu === "설정") return settings;
    if (visibleActiveMenu === "동아리활동") return club;
    if (visibleActiveMenu === "창체활동") return creative;
    return children;
  })();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__mark" aria-hidden="true">생</span>
          <strong>생기부 도우미</strong>
          <span>교사 업무 지원</span>
        </div>
        <nav aria-label="주요 업무" className="topbar__nav">
          {visibleTopMenus.map((menu) => (
            <button
              key={menu}
              type="button"
              className={visibleActiveMenu === menu ? "topbar__tab topbar__tab--active" : "topbar__tab"}
              onClick={() => setActiveMenu(menu)}
            >
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
        <Sidebar activeTopMenu={visibleActiveMenu} />
        <main className="workspace">{content}</main>
      </div>
    </div>
  );
}
