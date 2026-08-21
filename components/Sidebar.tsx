type SidebarProps = {
  activeTopMenu?: string;
};

const evaluationMenus = [
  { label: "학기말종합의견", kind: "group" },
  { label: "교과평어 작성기", selected: true },
] as const;

const clubMenus = [
  { label: "동아리활동", kind: "group" },
  { label: "동아리 활동 기록 작성기", selected: true },
] as const;

const creativeMenus = [
  { label: "창의적 체험활동", kind: "group" },
  { label: "창체 평어 작성기", selected: true },
] as const;

const settingsMenus = [
  { label: "관리자 설정", kind: "group" },
  { label: "관리자 승인", selected: true },
] as const;

function getSidebarConfig(activeTopMenu: string) {
  if (activeTopMenu === "설정") {
    return { heading: "설정관리", icon: "설", ariaLabel: "설정관리", menus: settingsMenus };
  }
  if (activeTopMenu === "동아리활동") {
    return { heading: "동아리관리", icon: "동", ariaLabel: "동아리관리", menus: clubMenus };
  }
  if (activeTopMenu === "창체활동") {
    return { heading: "창체관리", icon: "창", ariaLabel: "창체관리", menus: creativeMenus };
  }
  return { heading: "평가관리", icon: "평", ariaLabel: "평가관리", menus: evaluationMenus };
}

export function Sidebar({ activeTopMenu = "교과평어" }: SidebarProps) {
  const { heading, icon, ariaLabel, menus } = getSidebarConfig(activeTopMenu);

  return (
    <aside className="sidebar">
      <div className="sidebar__heading">
        <span className="sidebar__heading-icon" aria-hidden="true">{icon}</span>
        <span>{heading}</span>
      </div>
      <nav aria-label={ariaLabel} className="sidebar__nav">
        <ul>
          {menus.map((menu) => (
            <li key={menu.label}>
              {"kind" in menu ? (
                <div className="sidebar__group">
                  <span aria-hidden="true">▾</span>
                  {menu.label}
                </div>
              ) : (
                <button
                  type="button"
                  aria-current={"selected" in menu && menu.selected ? "page" : undefined}
                  className={`sidebar__item ${"selected" in menu && menu.selected ? "sidebar__item--selected" : ""}`}
                >
                  <span className="sidebar__branch" aria-hidden="true">└</span>
                  {menu.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar__notice">
        <span aria-hidden="true">안</span>
        <p>이 도구는 학교의 공식 시스템이 아닌 교사 업무 지원용 서비스입니다.</p>
      </div>
    </aside>
  );
}
