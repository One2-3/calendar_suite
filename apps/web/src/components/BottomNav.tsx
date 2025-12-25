// apps/web/src/components/BottomNav.tsx
type Props = {
  onMenu: () => void;
  onCompose: () => void;
  onSearch: () => void | Promise<void>;
  active?: "calendar" | "search";
};

export default function BottomNav(props: Props) {
  const { onMenu, onCompose, onSearch, active = "calendar" } = props;

  return (
    <div className="bottom-nav">
      <button className={["bn-btn", active === "calendar" ? "active" : ""].join(" ")} onClick={onMenu} type="button">
        메뉴
      </button>
      <button className="bn-btn primary" onClick={onCompose} type="button">
        +
      </button>
      <button className={["bn-btn", active === "search" ? "active" : ""].join(" ")} onClick={() => void onSearch()} type="button">
        검색
      </button>
    </div>
  );
}
