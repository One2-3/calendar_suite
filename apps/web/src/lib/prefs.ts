export type ThemeMode = "auto" | "light" | "dark";

const KEY_THEME = "theme_mode";
const KEY_ENABLED_CALS = "enabled_calendar_ids";

export function readThemeMode(): ThemeMode {
  const v = localStorage.getItem(KEY_THEME);
  if (v === "auto" || v === "light" || v === "dark") return v;
  return "auto";
}

export function writeThemeMode(mode: ThemeMode) {
  localStorage.setItem(KEY_THEME, mode);
  // TODO: 서버 settings 엔드포인트가 생기면 여기서 동기화
}

export function readEnabledCalendarIds(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KEY_ENABLED_CALS);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "boolean") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function writeEnabledCalendarIds(map: Record<string, boolean>) {
  try {
    localStorage.setItem(KEY_ENABLED_CALS, JSON.stringify(map));
    // TODO: 서버 settings 엔드포인트가 생기면 여기서 동기화
  } catch {
    // ignore
  }
}
