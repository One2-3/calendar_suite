// apps/web/src/auth/AuthProvider.tsx
import { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../lib/firebase";
import { themeStorage, tokenStorage, type ThemeMode } from "../lib/storage";
import { authApi, setOnAuthFailure } from "../lib/api";
import type { AuthStatus, ServerUser } from "./types";
import { AuthContext } from "./AuthContext";
import { applyTheme } from "../lib/theme";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // ✅ effect에서 setState 경고 피하려고 초기값을 여기서 결정
  const initialStatus: AuthStatus = tokenStorage.getAccess() ? "loading" : "guest";

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
      const user = await authApi.me(); // 내부에서 401→refresh→retry 처리
      setMe(user);
      setStatus("authed");
    } catch {
      await logout();
    }
  };

  useEffect(() => {
    // api.ts에서 refresh 실패하면 강제 logout 되도록 연결
    setOnAuthFailure(() => {
      void logout();
    });

    // access 없으면 그대로 guest
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
