// apps/web/src/auth/AuthContext.ts
import { createContext } from "react";
import type { AuthStatus, ServerUser } from "./types";

export type AuthCtx = {
  status: AuthStatus;
  me: ServerUser | null;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthCtx | null>(null);
