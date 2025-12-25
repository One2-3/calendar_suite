// apps/web/src/lib/theme.ts
export type ThemeMode = "auto" | "light" | "dark";

const KEY = "themeMode";

export function getStoredThemeMode(): ThemeMode {
  const v = localStorage.getItem(KEY);
  if (v === "light" || v === "dark" || v === "auto") return v;
  return "auto";
}

export function setStoredThemeMode(mode: ThemeMode) {
  localStorage.setItem(KEY, mode);
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;

  const resolved: "light" | "dark" =
    mode === "auto"
      ? window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
        ? "dark"
        : "light"
      : mode;

  root.classList.remove("dark", "light");
  root.classList.add(resolved);
}

/** 앱 시작 시 1회 호출 (auto면 matchMedia 변화도 반영) */
export function initTheme() {
  const mode = getStoredThemeMode();
  applyTheme(mode);

  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mq) return;

  const onChange = () => {
    if (getStoredThemeMode() === "auto") applyTheme("auto");
  };

  // 타입 안전하게 분기 (any 사용 X)
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onChange);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(onChange);
  }
}
