const navItems = [
  { id: "home", label: "홈" },
  { id: "apps", label: "교과 앱" },
  { id: "about", label: "소개" },
];

export default function Header({ currentPage, onNavigate }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <button
          className="brand"
          type="button"
          onClick={() => onNavigate("home")}
          aria-label="홈으로 이동"
        >
          <span className="brand-icon" aria-hidden="true">
            책
          </span>
          <span>바이브 코딩 놀이터</span>
        </button>

        <nav className="nav-menu" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={currentPage === item.id ? "active" : ""}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
