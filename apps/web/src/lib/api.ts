// apps/web/src/lib/api.ts
import { tokenStorage } from "./storage";
import type { ServerUser } from "../auth/types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

type TokenResponseSnake = { access_token: string; refresh_token: string };
type TokenResponseCamel = { accessToken: string; refreshToken: string };

function isTokenSnake(v: unknown): v is TokenResponseSnake {
  return !!v && typeof v === "object" && "access_token" in v && "refresh_token" in v;
}
function isTokenCamel(v: unknown): v is TokenResponseCamel {
  return !!v && typeof v === "object" && "accessToken" in v && "refreshToken" in v;
}

function normalizeTokens(v: unknown): { accessToken: string; refreshToken: string } {
  if (isTokenCamel(v)) return { accessToken: v.accessToken, refreshToken: v.refreshToken };
  if (isTokenSnake(v)) return { accessToken: v.access_token, refreshToken: v.refresh_token };
  throw new Error("Invalid token response shape");
}

// AuthProvider에서 등록해두면, refresh 실패 시 여기서 호출해서 강제 로그아웃 처리 가능
let onAuthFailure: (() => void) | null = null;
export function setOnAuthFailure(fn: (() => void) | null) {
  onAuthFailure = fn;
}

async function jsonFetch<T>(
  path: string,
  init?: RequestInit,
  opts?: { withAuth?: boolean; retryOn401?: boolean }
): Promise<T> {
  if (!API_BASE) throw new Error("VITE_API_BASE_URL is empty");

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (opts?.withAuth) {
    const access = tokenStorage.getAccess();
    if (access) headers.set("Authorization", `Bearer ${access}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  // 401 → refresh 시도 후 1회 재시도
  if (res.status === 401 && opts?.retryOn401) {
    const ok = await tryRefresh();
    if (!ok) {
      onAuthFailure?.();
      throw new Error("Unauthorized (refresh failed)");
    }
    // retry with new token
    const headers2 = new Headers(init?.headers);
    headers2.set("Content-Type", "application/json");
    const access2 = tokenStorage.getAccess();
    if (access2) headers2.set("Authorization", `Bearer ${access2}`);

    const res2 = await fetch(`${API_BASE}${path}`, { ...init, headers: headers2 });
    if (!res2.ok) {
      const msg = await safeText(res2);
      throw new Error(msg || `HTTP ${res2.status}`);
    }
    return (await res2.json()) as T;
  }

  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

async function tryRefresh(): Promise<boolean> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return false;

  try {
    const data = await jsonFetch<unknown>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: refresh }),
    });
    const t = normalizeTokens(data);
    tokenStorage.set(t.accessToken, t.refreshToken);
    return true;
  } catch {
    tokenStorage.clear();
    return false;
  }
}

export const authApi = {
  // POST {API}/auth/firebase  body: { idToken }
  async firebaseExchange(idToken: string) {
    const data = await jsonFetch<unknown>("/auth/firebase", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
    const t = normalizeTokens(data);
    tokenStorage.set(t.accessToken, t.refreshToken);
    return t;
  },

  // GET /auth/me (Bearer access)
  async me(): Promise<ServerUser> {
    return await jsonFetch<ServerUser>("/auth/me", { method: "GET" }, { withAuth: true, retryOn401: true });
  },
};
