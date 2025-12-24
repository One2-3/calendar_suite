import { useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { themeStorage, type ThemeMode } from "../lib/storage";
import { applyTheme } from "../lib/theme";

export default function SideDrawer(props: { open: boolean; onClose: () => void }) {
  const { open, onClose } = props;
  const { me, themeMode, setThemeMode, logout } = useAuth();
  const [localTheme, setLocalTheme] = useState<ThemeMode>(themeMode);

  const userLine = useMemo(() => {
    if (!me) return "Unknown";
    return me.displayName || me.email || me.id;
  }, [me]);

  if (!open) return null;

  const onChangeTheme = (m: ThemeMode) => {
    setLocalTheme(m);
    setThemeMode(m);
    themeStorage.set(m);
    applyTheme(m);
  };

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>메뉴</h3>

        <div className="row">
          <div style={{ color: "var(--muted)" }}>사용자</div>
        </div>
        <div style={{ fontWeight: 700 }}>{userLine}</div>

        <div style={{ height: 8 }} />

        <div className="row">
          <div style={{ color: "var(--muted)" }}>테마</div>
        </div>
        <select
          className="select"
          value={localTheme}
          onChange={(e) => onChangeTheme(e.target.value as ThemeMode)}
        >
          <option value="auto">auto</option>
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>

        <div style={{ height: 8 }} />

        <div className="row">
          <div style={{ color: "var(--muted)" }}>캘린더 소스</div>
        </div>
        <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
          TODO: calendars 목록/토글은 서버 연동 후 연결
        </div>

        <div style={{ height: 8 }} />

        <button
          className="btn"
          type="button"
          onClick={async () => {
            await logout();
            onClose();
          }}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
