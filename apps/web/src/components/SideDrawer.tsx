// apps/web/src/components/SideDrawer.tsx
import { useEffect, useMemo, useState } from "react";
import { getStoredThemeMode, setStoredThemeMode, applyTheme, ThemeMode } from "../lib/theme";
import { tokenStorage } from "../lib/storage";
import { getAuth, signOut } from "firebase/auth";

type MeView = { email?: string; role?: string };
type Calendar = { id: string; name?: string | null };

function readEnabledCalendarIds(): Record<string, boolean> {
  try {
    const s = localStorage.getItem("enabledCalendarIds");
    if (!s) return {};
    const parsed = JSON.parse(s) as unknown;
    if (parsed && typeof parsed === "object") return parsed as Record<string, boolean>;
  } catch {
    // ignore
  }
  return {};
}

export default function SideDrawer(props: {
  open: boolean;
  onClose: () => void;
  calendars: Calendar[];
  enabledCalendarIds: Record<string, boolean>;
  onToggleCalendar: (id: string, enabled: boolean) => void;
}) {
  const { open, onClose, calendars, enabledCalendarIds, onToggleCalendar } = props;

  const [theme, setTheme] = useState<ThemeMode>(() => getStoredThemeMode());
  const [me, setMe] = useState<MeView>({});

  useEffect(() => {
    if (!open) return;
    setMe({});
  }, [open]);
  

  const enabledIds = useMemo(() => {
    const any = Object.keys(enabledCalendarIds).length > 0;
    if (!any) return calendars.map((c) => c.id);
    return calendars.map((c) => c.id).filter((id) => enabledCalendarIds[id] ?? true);
  }, [calendars, enabledCalendarIds]);

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div style={{ fontWeight: 600 }}>설정</div>
          <button className="icon-btn" onClick={onClose} aria-label="close">
            ✕
          </button>
        </div>

        <div className="drawer-section">
          <div style={{ fontSize: 12, opacity: 0.7 }}>계정</div>
          <div style={{ marginTop: 6 }}>{me.email ?? "unknown"}</div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button
              className="btn danger"
              onClick={async () => {
                const ok = window.confirm("로그아웃 할까요?");
                if (!ok) return;
                try {
                  await signOut(getAuth());
                } finally {
                  tokenStorage.clear?.();
                  location.href = "/";
                }
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        <div className="drawer-section">
          <div style={{ fontSize: 12, opacity: 0.7 }}>테마</div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            {(["system", "light", "dark"] as ThemeMode[]).map((m) => (
              <button
                key={m}
                className={["btn", theme === m ? "primary" : ""].join(" ")}
                onClick={() => {
                  setTheme(m);
                  setStoredThemeMode(m);
                  applyTheme(m);
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="drawer-section">
          <div style={{ fontSize: 12, opacity: 0.7 }}>캘린더</div>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {calendars.map((c) => {
              const checked = enabledIds.includes(c.id);
              return (
                <label key={c.id} className="check-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      onToggleCalendar(c.id, e.target.checked);
                      const next = { ...readEnabledCalendarIds(), [c.id]: e.target.checked };
                      localStorage.setItem("enabledCalendarIds", JSON.stringify(next));
                    }}
                  />
                  <span>{c.name ?? c.id}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="drawer-foot" />
      </div>
    </div>
  );
}
