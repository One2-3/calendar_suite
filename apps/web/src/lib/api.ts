// apps/web/src/lib/api.ts
import { tokenStorage } from "./storage";
import type { ServerUser } from "../auth/types";

/**
 * 엔드포인트 상수 (프로젝트마다 쉽게 교체 가능)
 * - CalendarPage / ComposerModal 이 기대하는 API 형태를 우선 지원
 */
export const AUTH_ME = "/auth/me";
export const AUTH_FIREBASE = "/auth/firebase";
export const AUTH_REFRESH = "/auth/refresh";

export const CALENDARS_LIST = "/calendars";
export const EVENTS_LIST = "/events";
export const EVENTS_CREATE = "/events";
export const TASKS_LIST = "/tasks";
export const TASKS_CREATE = "/tasks";
export const NOTES_CREATE = "/notes"; // 서버가 없을 수 있음

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

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export class ApiErrorImpl extends Error implements ApiError {
  code: string;
  details?: unknown;
  constructor(input: ApiError) {
    super(input.message);
    this.name = "ApiError";
    this.code = input.code;
    this.details = input.details;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function toApiError(res: Response): Promise<ApiErrorImpl> {
  const data = await safeJson(res);

  // 서버 공통 포맷(code/message/details) 우선
  if (isRecord(data)) {
    const msg = typeof data.message === "string" ? data.message : undefined;
    if (msg) {
      const code = typeof data.code === "string" ? data.code : `HTTP_${res.status}`;
      return new ApiErrorImpl({ code, message: msg, details: (data as Record<string, unknown>).details });
    }
  }

  return new ApiErrorImpl({
    code: `HTTP_${res.status}`,
    message: `요청 실패 (HTTP ${res.status})`,
    details: data ?? undefined,
  });
}

function toQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
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

    const headers2 = new Headers(init?.headers);
    headers2.set("Content-Type", "application/json");
    const access2 = tokenStorage.getAccess();
    if (access2) headers2.set("Authorization", `Bearer ${access2}`);

    const res2 = await fetch(`${API_BASE}${path}`, { ...init, headers: headers2 });
    if (!res2.ok) throw await toApiError(res2);
    return (await res2.json()) as T;
  }

  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return false;

  try {
    const data = await jsonFetch<unknown>(AUTH_REFRESH, {
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

// -----------------
// Auth
// -----------------

export const authApi = {
  // POST {API}/auth/firebase  body: { idToken }
  async firebaseExchange(idToken: string) {
    const data = await jsonFetch<unknown>(AUTH_FIREBASE, {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
    const t = normalizeTokens(data);
    tokenStorage.set(t.accessToken, t.refreshToken);
    return t;
  },

  // GET /auth/me (Bearer access)
  async me(): Promise<ServerUser> {
    return await jsonFetch<ServerUser>(AUTH_ME, { method: "GET" }, { withAuth: true, retryOn401: true });
  },
};

// -----------------
// Calendar domain types
// -----------------

export type Page<T> = {
  content: T[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};

export type Calendar = {
  id: string;
  name: string;
};

export type Event = {
  id: string;
  calendar_id: string;
  title: string;
  description?: string | null;
  start_at: string; // ISO
  end_at: string; // ISO
  is_all_day?: boolean;
};

export type TaskStatus = "PENDING" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type Task = {
  id: string;
  calendar_id: string;
  title: string;
  description?: string | null;
  due_at: string; // ISO
  status: TaskStatus;
  priority?: TaskPriority | null;
  type?: string | null; // e.g. "MEMO" (fallback)
  // 서버에 따라 다른 필드가 올 수 있어도 런타임에서는 무시
};

function asArray(v: unknown): unknown[] | null {
  return Array.isArray(v) ? v : null;
}

function pickString(o: Record<string, unknown>, key: string): string | null {
  const v = o[key];
  return typeof v === "string" ? v : null;
}

function normalizeEvent(raw: unknown): Event | null {
  if (!isRecord(raw)) return null;
  const id = pickString(raw, "id");
  const calendar_id = pickString(raw, "calendar_id") ?? pickString(raw, "calendarId");
  const title = pickString(raw, "title") ?? "";
  const start_at = pickString(raw, "start_at") ?? pickString(raw, "startAt");
  const end_at = pickString(raw, "end_at") ?? pickString(raw, "endAt");
  if (!id || !calendar_id || !start_at || !end_at) return null;
  const description = pickString(raw, "description");
  const is_all_day = typeof raw.is_all_day === "boolean" ? raw.is_all_day : typeof raw.isAllDay === "boolean" ? raw.isAllDay : undefined;
  return { id, calendar_id, title, description, start_at, end_at, is_all_day };
}

function normalizeTask(raw: unknown): Task | null {
  if (!isRecord(raw)) return null;
  const id = pickString(raw, "id");
  const calendar_id = pickString(raw, "calendar_id") ?? pickString(raw, "calendarId");
  const title = pickString(raw, "title") ?? "";
  const due_at = pickString(raw, "due_at") ?? pickString(raw, "dueAt");
  const status = (pickString(raw, "status") ?? "PENDING") as TaskStatus;
  if (!id || !calendar_id || !due_at) return null;
  const description = pickString(raw, "description");
  const priority = (pickString(raw, "priority") as TaskPriority | null) ?? null;
  const type = pickString(raw, "type");
  return { id, calendar_id, title, description, due_at, status, priority, type };
}

function extractContent(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isRecord(raw) && Array.isArray(raw.content)) return raw.content as unknown[];
  return [];
}

// -----------------
// Calendar / Event / Task APIs
// -----------------

export const calendarApi = {
  async list(input: { page: number; size: number }): Promise<Page<Calendar>> {
    return await jsonFetch<Page<Calendar>>(`${CALENDARS_LIST}${toQuery(input)}`, { method: "GET" }, { withAuth: true, retryOn401: true });
  },
};

export const eventApi = {
  async list(input: {
    calendar_id: string;
    page: number;
    size: number;
    start_from?: string;
    start_to?: string;
  }): Promise<Page<Event>> {
    return await jsonFetch<Page<Event>>(`${EVENTS_LIST}${toQuery(input)}`, { method: "GET" }, { withAuth: true, retryOn401: true });
  },

  async create(input: {
    calendar_id: string;
    title: string;
    description?: string | null;
    start_at: string;
    end_at: string;
    is_all_day?: boolean;
  }): Promise<Event> {
    return await jsonFetch<Event>(
      EVENTS_CREATE,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      { withAuth: true, retryOn401: true }
    );
  },

  /**
   * keyword 검색 (서버가 지원하면 사용)
   * - 기대 스펙: GET /events?keyword=...
   * - 서버에 따라 Page<T> 또는 T[] 형태로 올 수 있어 둘 다 지원
   */
  async search(input: { keyword: string }): Promise<Event[]> {
    const raw = await jsonFetch<unknown>(`${EVENTS_LIST}${toQuery({ keyword: input.keyword })}`, { method: "GET" }, { withAuth: true, retryOn401: true });

    // Page<Event>
    if (isRecord(raw) && Array.isArray((raw as Record<string, unknown>).content)) {
      return (raw as Page<Event>).content;
    }
    // Event[]
    const arr = asArray(raw);
    if (arr) return arr as Event[];

    return [];
  },
};

/**
 * keyword 검색 (서버가 지원하면 사용)
 * - 응답이 Page<Event> 또는 Event[] 여도 동작하도록 방어적으로 파싱
 */
export async function searchEvents(keyword: string): Promise<Event[]> {
  const raw = await jsonFetch<unknown>(`${EVENTS_LIST}${toQuery({ keyword })}`, { method: "GET" }, { withAuth: true, retryOn401: true });
  const items = extractContent(raw);
  const out: Event[] = [];
  for (const it of items) {
    const ev = normalizeEvent(it);
    if (ev) out.push(ev);
  }
  return out;
}

export const taskApi = {
  async list(input: {
    calendar_id: string;
    page: number;
    size: number;
    due_from?: string;
    due_to?: string;
  }): Promise<Page<Task>> {
    return await jsonFetch<Page<Task>>(`${TASKS_LIST}${toQuery(input)}`, { method: "GET" }, { withAuth: true, retryOn401: true });
  },

  async create(input: {
    calendar_id: string;
    title: string;
    description?: string | null;
    due_at: string;
    status: TaskStatus;
    priority?: TaskPriority | null;
    type?: string;
  }): Promise<Task> {
    return await jsonFetch<Task>(
      TASKS_CREATE,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      { withAuth: true, retryOn401: true }
    );
  },

  /**
   * keyword 검색 (서버가 지원하면 사용)
   * - 기대 스펙: GET /tasks?keyword=...
   * - 서버에 따라 Page<T> 또는 T[] 형태로 올 수 있어 둘 다 지원
   */
  async search(input: { keyword: string }): Promise<Task[]> {
    const raw = await jsonFetch<unknown>(`${TASKS_LIST}${toQuery({ keyword: input.keyword })}`, { method: "GET" }, { withAuth: true, retryOn401: true });

    if (isRecord(raw) && Array.isArray((raw as Record<string, unknown>).content)) {
      return (raw as Page<Task>).content;
    }
    const arr = asArray(raw);
    if (arr) return arr as Task[];
    return [];
  },
};

/** keyword 검색 (서버가 지원하면 사용) */
export async function searchTasks(keyword: string): Promise<Task[]> {
  const raw = await jsonFetch<unknown>(`${TASKS_LIST}${toQuery({ keyword })}`, { method: "GET" }, { withAuth: true, retryOn401: true });
  const items = extractContent(raw);
  const out: Task[] = [];
  for (const it of items) {
    const t = normalizeTask(it);
    if (t) out.push(t);
  }
  return out;
}

// -----------------
// NOTE / MEMO fallback helper (optional)
// -----------------

export const notesApi = {
  async create(input: { calendar_id: string; dateISO: string; title: string; memo?: string }): Promise<void> {
    await jsonFetch<void>(
      NOTES_CREATE,
      {
        method: "POST",
        body: JSON.stringify({
          calendar_id: input.calendar_id,
          date: input.dateISO,
          title: input.title,
          memo: input.memo ?? null,
        }),
      },
      { withAuth: true, retryOn401: true }
    );
  },
};
