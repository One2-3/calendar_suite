import type { ThemeMode } from "../lib/storage";

export type AuthStatus = "loading" | "guest" | "authed";

export type ServerUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  photoURL?: string | null;
};

export type AuthCtx = {
  status: AuthStatus;
  me: ServerUser | null;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};
