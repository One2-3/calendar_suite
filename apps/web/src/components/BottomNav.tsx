function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden="true" style={{ display: "inline-flex", width: 18, height: 18 }}>
      {children}
    </span>
  );
}

export default function BottomNav(props: {
  onMenu: () => void;
  onCompose: () => void;
  onSearch: () => void;
  active?: "home" | "search";
}) {
  return (
    <div className="bottom-nav">
      <div className="bottom-nav-inner">
        <button className="nav-btn" onClick={props.onMenu} aria-label="menu">
          <Icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Icon>
          <span>메뉴</span>
        </button>

        <button className="nav-btn primary" onClick={props.onCompose} aria-label="compose">
          <Icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </Icon>
          <span>작성</span>
        </button>

        <button className="nav-btn" onClick={props.onSearch} aria-label="search">
          <Icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" />
            </svg>
          </Icon>
          <span>검색</span>
        </button>
      </div>
    </div>
  );
}
