// apps/web/src/components/SideDrawer.tsx
import { useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import type { Calendar } from "../lib/api";
import { themeStorage, type ThemeMode } from "../lib/storage";
import { applyTheme } from "../lib/theme";

type Props = {
  open: boolean;
  onClose: () => void;

  // ✅ CalendarPage에서 넘기는 props들: 일단 optional로 받아서 타입 에러 제거
  calendars?: Calendar[];
  enabledCalendarIds?: Record<string, boolean>;
  onToggleCalendar?: (id: string, enabled: boolean) => void;
};

export default function SideDrawer(props: Props) {
  const { open, onClose } = props;
  const { me, themeMode, setThemeMode, logout } = useAuth();
  const [localTheme, setLocalTheme] = useState<ThemeMode>(themeMode);

  const calendars = props.calendars ?? [];
  const enabledMap = props.enabledCalendarIds ?? {};

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

        <div style={{ height: 10 }} />

        <div className="row">
          <div style={{ color: "var(--muted)" }}>테마</div>
        </div>
        <select className="select" value={localTheme} onChange={(e) => onChangeTheme(e.target.value as ThemeMode)}>
          <option value="auto">auto</option>
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>

        {calendars.length ? (
          <>
            <div style={{ height: 12 }} />
            <div className="row">
              <div style={{ color: "var(--muted)" }}>캘린더</div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {calendars.map((c) => {
                const enabled = enabledMap[c.id] ?? true;
                return (
                  <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => props.onToggleCalendar?.(c.id, e.target.checked)}
                    />
                    <span style={{ fontSize: 14 }}>{c.name}</span>
                  </label>
                );
              })}
            </div>
          </>
        ) : null}

        <div style={{ height: 14 }} />

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
