const menus = [
  { label: "학기말종합의견", kind: "group" },
  { label: "교과평어 작성기", selected: true },
  { label: "평가계획 관리" },
  { label: "예시문 관리" },
  { label: "사용량 관리" },
] as const;

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__heading">
        <span className="sidebar__heading-icon" aria-hidden="true">✓</span>
        <span>평가관리</span>
      </div>
      <nav aria-label="평가관리" className="sidebar__nav">
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
        <span aria-hidden="true">ⓘ</span>
        <p>이 도구는 학교의 공식 시스템이 아닌 교사 업무 지원용 서비스입니다.</p>
      </div>
    </aside>
  );
}
