// apps/web/src/components/BottomNav.tsx
type Props = {
  onMenu: () => void;
  onCompose: () => void;
  onSearch: () => void;
  active?: "calendar" | "compose" | "search";
};

export default function BottomNav(props: Props) {
  const { onMenu, onCompose, onSearch, active = "calendar" } = props;

  return (
    <div className="bottom-nav" role="navigation" aria-label="bottom navigation">
      <button
        type="button"
        className={["bottom-nav-btn", active === "calendar" ? "bottom-nav-btn-primary" : ""].join(" ")}
        onClick={onMenu}
      >
        메뉴
      </button>

      <div className="bottom-nav-spacer" />

      <button type="button" className={["bottom-nav-btn", "bottom-nav-btn-primary"].join(" ")} onClick={onCompose}>
        +
      </button>

      <div className="bottom-nav-spacer" />

      <button
        type="button"
        className={["bottom-nav-btn", active === "search" ? "bottom-nav-btn-primary" : ""].join(" ")}
        onClick={onSearch}
      >
        검색
      </button>
    </div>
  );
}
