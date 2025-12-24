// apps/web/src/components/AppLayout.tsx
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import BottomNav from "./BottomNav";

export default function AppLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-title">Calendar</div>
        <div className="topbar-sub">{loc.pathname.startsWith("/app/search") ? "Search" : "App"}</div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <BottomNav
        onMenu={() => setDrawerOpen(true)}
        onCompose={() => alert("TODO: compose")}
        onSearch={() => nav("/app/search")}
        active={loc.pathname.startsWith("/app/search") ? "search" : "home"}
      />

      {drawerOpen ? (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <h3>메뉴</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>TODO: drawer contents</p>
            <button className="btn" onClick={() => setDrawerOpen(false)}>닫기</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
