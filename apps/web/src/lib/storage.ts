export type ThemeMode = "auto" | "light" | "dark";

const K_ACCESS = "accessToken";
const K_REFRESH = "refreshToken";
const K_THEME = "themeMode";

export const tokenStorage = {
  getAccess(): string | null {
    return localStorage.getItem(K_ACCESS);
  },
  getRefresh(): string | null {
    return localStorage.getItem(K_REFRESH);
  },
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem(K_ACCESS, accessToken);
    localStorage.setItem(K_REFRESH, refreshToken);
  },
  clear() {
    localStorage.removeItem(K_ACCESS);
    localStorage.removeItem(K_REFRESH);
  },
};

export const themeStorage = {
  get(): ThemeMode {
    const v = localStorage.getItem(K_THEME) as ThemeMode | null;
    return v ?? "auto";
  },
  set(v: ThemeMode) {
    localStorage.setItem(K_THEME, v);
  },
};
