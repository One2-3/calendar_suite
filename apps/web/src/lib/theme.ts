import type { ThemeMode } from "./storage";

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  const theme = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;
  root.dataset.theme = theme;
}
