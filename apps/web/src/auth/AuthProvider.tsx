// apps/web/src/auth/AuthProvider.tsx
import { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../lib/firebase";
import { themeStorage, tokenStorage, type ThemeMode } from "../lib/storage";
import type { AuthStatus, ServerUser } from "./types";
import { AuthContext } from "./AuthContext";
import { applyTheme } from "../lib/theme";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const AUTH_ME = `${API_BASE}/auth/me`;

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

const DEV_USER: ServerUser = {
  id: "dev-user",
  email: "dev@local",
  displayName: "Dev User",
  role: "DEV",
  photoURL: null,
};


async function fetchMe(accessToken: string): Promise<ServerUser> {
  const res = await fetch(AUTH_ME, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }

  return (await res.json()) as ServerUser;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // ✅ effect에서 setState 경고 피하려고 초기값을 여기서 결정
  const initialStatus: AuthStatus = DEV_BYPASS
  ? "authed"
  : tokenStorage.getAccess()
    ? "loading"
    : "guest";


  const [status, setStatus] = useState<AuthStatus>(initialStatus);
  const [me, setMe] = useState<ServerUser | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => themeStorage.get());

  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  const logout = async () => {
    tokenStorage.clear();
    setMe(null);
    setStatus("guest");
    try {
      await signOut(firebaseAuth);
    } catch {
      // ignore
    }
  };

  const refreshMe = async () => {
    try {
      setStatus("loading");
      const access = tokenStorage.getAccess();
      if (!access) throw new Error("No access token");
      const user = await fetchMe(access);
      setMe(user);
      setStatus("authed");
    } catch {
      await logout();
    }
  };

  useEffect(() => {
    if (DEV_BYPASS) {
      setMe(DEV_USER);
      setStatus("authed");
      return;
    }
  
    const access = tokenStorage.getAccess();
    if (!access) return;
  
    void refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  

  const value = useMemo(
    () => ({ status, me, themeMode, setThemeMode, refreshMe, logout }),
    [status, me, themeMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
