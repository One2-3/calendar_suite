// apps/web/src/lib/api.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

import { tokenStorage } from "./storage";
import type { ServerUser } from "../auth/types";

export type Page<T> = {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
};

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const json = (await res.json()) as unknown;
    if (isRecord(json)) {
      const code =
        (typeof json.code === "string" && json.code) ||
        (typeof json.error === "string" && json.error) ||
        `HTTP_${res.status}`;
      const message =
        (typeof json.message === "string" && json.message) || res.statusText || "Request failed";
      const details = json.details;
      return { code, message, details };
    }
  } catch {
    // ignore
  }
  return { code: `HTTP_${res.status}`, message: res.statusText || "Request failed" };
}

// ---- endpoints (상수로 관리) ----
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export const AUTH_ME = `${API_BASE}/auth/me`;
export const AUTH_REFRESH = `${API_BASE}/auth/refresh`;
export const AUTH_FIREBASE_EXCHANGE = `${API_BASE}/auth/firebase`;

export const CALENDARS_LIST = `${API_BASE}/calendars`;
export const EVENTS_LIST = `${API_BASE}/events`;
export const TASKS_LIST = `${API_BASE}/tasks`;
export const NOTES_CREATE = `${API_BASE}/notes`;

let onAuthFailure: (() => void) | null = null;

/**
 * api.ts 내부에서 refresh 실패/401 처리 시, 상위(AuthProvider)에서 logout을 트리거할 수 있게 콜백을 주입한다.
 */
export function setOnAuthFailure(cb: (() => void) | null) {
  onAuthFailure = cb;
}

type TokenPair = { accessToken: string; refreshToken: string };

function normalizeTokenPair(raw: unknown): TokenPair | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const access =
    (typeof r.accessToken === "string" && r.accessToken) ||
    (typeof r.access_token === "string" && r.access_token);
  const refresh =
    (typeof r.refreshToken === "string" && r.refreshToken) ||
    (typeof r.refresh_token === "string" && r.refresh_token);
  if (!access || !refresh) return null;
  return { accessToken: access, refreshToken: refresh };
}

function getToken(): string | null {
  return tokenStorage.getAccess();
}

async function refreshTokensOrThrow(): Promise<void> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) {
    onAuthFailure?.();
    throw new Error("No refresh token");
  }

  const res = await fetch(AUTH_REFRESH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    onAuthFailure?.();
    throw await toApiError(res);
  }

  const json = await res.json();
  const pair = normalizeTokenPair(json);
  if (!pair) {
    onAuthFailure?.();
    throw new Error("Invalid refresh response");
  }

  tokenStorage.set(pair.accessToken, pair.refreshToken);
}

type JsonFetchInit = RequestInit & {
  withAuth?: boolean;
  retryOn401?: boolean;
};

async function jsonFetch<T>(url: string, init: JsonFetchInit = {}): Promise<T> {
  const { withAuth, retryOn401, ...rest } = init;

  const headers = new Headers(rest.headers);
  headers.set("Content-Type", "application/json");

  if (withAuth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...rest, headers });

  if (!res.ok) {
    // 401이면 refresh 후 1회 재시도
    if (res.status === 401 && retryOn401 && withAuth) {
      await refreshTokensOrThrow();
      const retryHeaders = new Headers(headers);
      const next = getToken();
      if (next) retryHeaders.set("Authorization", `Bearer ${next}`);
      const retryRes = await fetch(url, { ...rest, headers: retryHeaders });

      if (!retryRes.ok) {
        if (retryRes.status === 401) onAuthFailure?.();
        throw await toApiError(retryRes);
      }

      if (retryRes.status === 204) return undefined as T;
      return (await retryRes.json()) as T;
    }

    if (res.status === 401) onAuthFailure?.();
    throw await toApiError(res);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---- auth api ----
export const authApi = {
  /**
   * 서버가 내려주는 access/refresh 토큰을 tokenStorage에 저장
   */
  async firebaseExchange(idToken: string): Promise<void> {
    const res = await fetch(AUTH_FIREBASE_EXCHANGE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw await toApiError(res);

    const json = await res.json();
    const pair = normalizeTokenPair(json);
    if (!pair) throw new Error("Invalid token response from /auth/firebase");
    tokenStorage.set(pair.accessToken, pair.refreshToken);
  },

  async refresh(): Promise<void> {
    await refreshTokensOrThrow();
  },

  async me(): Promise<ServerUser> {
    return await jsonFetch<ServerUser>(AUTH_ME, { withAuth: true, retryOn401: true });
  },
};

// ---- helpers (normalize용) ----
function pickString(raw: unknown, key: string): string | undefined {
  if (!isRecord(raw)) return undefined;
  const v = raw[key];
  return typeof v === "string" ? v : undefined;
}

function extractContent(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isRecord(raw) && Array.isArray(raw.content)) return raw.content as unknown[];
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items as unknown[];
  return [];
}

function normalizePage<T>(raw: unknown, map: (x: unknown) => T): Page<T> {
  const content = extractContent(raw).map(map);
  if (!isRecord(raw)) return { content };

  const totalElements =
    typeof raw.totalElements === "number" ? raw.totalElements : undefined;
  const totalPages = typeof raw.totalPages === "number" ? raw.totalPages : undefined;
  const number = typeof raw.number === "number" ? raw.number : undefined;
  const size = typeof raw.size === "number" ? raw.size : undefined;

  return { content, totalElements, totalPages, number, size };
}

function normalizeEvent(raw: unknown): Event {
  if (!isRecord(raw)) throw new Error("Invalid event");
  return {
    id: String(raw.id ?? raw.event_id ?? ""),
    calendar_id: String(raw.calendar_id ?? raw.calendarId ?? ""),
    title: String(raw.title ?? ""),
    description: (typeof raw.description === "string" ? raw.description : null) ?? null,
    start_at: String(raw.start_at ?? raw.startAt ?? raw.start ?? ""),
    end_at: String(raw.end_at ?? raw.endAt ?? raw.end ?? ""),
    is_all_day: Boolean(raw.is_all_day ?? raw.isAllDay ?? false),
  };
}

function normalizeTask(raw: unknown): Task {
  if (!isRecord(raw)) throw new Error("Invalid task");
  const statusRaw =
    pickString(raw, "status") ?? pickString(raw, "state") ?? pickString(raw, "completed");
  let status: TaskStatus = "PENDING";
  if (typeof statusRaw === "string") {
    const s = statusRaw.toUpperCase();
    if (s.includes("COMP")) status = "COMPLETED";
    else if (s.includes("CANCEL")) status = "CANCELLED";
    else status = "PENDING";
  }

  const priorityRaw = pickString(raw, "priority");
  let priority: TaskPriority | null = null;
  if (priorityRaw) {
    const p = priorityRaw.toUpperCase();
    if (p === "LOW" || p === "MEDIUM" || p === "HIGH") priority = p;
  }

  return {
    id: String(raw.id ?? raw.task_id ?? ""),
    calendar_id: String(raw.calendar_id ?? raw.calendarId ?? ""),
    title: String(raw.title ?? ""),
    description: (typeof raw.description === "string" ? raw.description : null) ?? null,
    due_at: String(raw.due_at ?? raw.dueAt ?? raw.due ?? ""),
    status,
    priority,
    type: (typeof raw.type === "string" ? raw.type : null) ?? null,
  };
}

// ---- types ----
export type Event = {
  id: string;
  calendar_id: string;
  title: string;
  description?: string | null;
  start_at: string; // ISO
  end_at: string; // ISO
  is_all_day: boolean;
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
  type?: string | null; // e.g. "MEMO"
};

export type Note = {
  id: string;
  calendar_id: string;
  date: string; // YYYY-MM-DD
  title?: string | null;
  memo?: string | null;
};

// ---- calendar / events / tasks apis ----

export const calendarsApi = {
  async list(): Promise<Array<{ id: string; name?: string | null }>> {
    const raw = await jsonFetch<unknown>(CALENDARS_LIST, { withAuth: true, retryOn401: true });
    if (Array.isArray(raw)) {
      return raw.map((x) => {
        if (!isRecord(x)) return { id: String(x) };
        return { id: String(x.id ?? x.calendar_id ?? ""), name: (typeof x.name === "string" ? x.name : null) ?? null };
      });
    }
    if (isRecord(raw) && Array.isArray(raw.content)) {
      return (raw.content as unknown[]).map((x) => {
        if (!isRecord(x)) return { id: String(x) };
        return { id: String(x.id ?? x.calendar_id ?? ""), name: (typeof x.name === "string" ? x.name : null) ?? null };
      });
    }
    return [];
  },
};

export const eventsApi = {
  async list(params?: { dateFrom?: string; dateTo?: string; calendarId?: string }): Promise<Page<Event>> {
    const qs = new URLSearchParams();
    if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params?.dateTo) qs.set("dateTo", params.dateTo);
    if (params?.calendarId) qs.set("calendarId", params.calendarId);

    return await jsonFetch<Page<Event>>(`${EVENTS_LIST}?${qs.toString()}`, {
      withAuth: true,
      retryOn401: true,
    });
  },

  async create(input: {
    calendar_id: string;
    title: string;
    description?: string | null;
    is_all_day: boolean;
    start_at: string;
    end_at: string;
  }): Promise<Event> {
    return await jsonFetch<Event>(EVENTS_LIST, {
      method: "POST",
      body: JSON.stringify(input),
      withAuth: true,
      retryOn401: true,
    });
  },

  async update(
    id: string,
    input: Partial<{
      title: string;
      description: string | null;
      is_all_day: boolean;
      start_at: string;
      end_at: string;
    }>
  ): Promise<Event> {
    return await jsonFetch<Event>(EVENTS_DETAIL(id), {
      method: "PATCH",
      body: JSON.stringify(input),
      withAuth: true,
      retryOn401: true,
    });
  },

  async remove(id: string): Promise<void> {
    await jsonFetch<void>(EVENTS_DETAIL(id), { method: "DELETE", withAuth: true, retryOn401: true });
  },
};

export const TASKS_DETAIL = (id: string) =>
  `${API_BASE}/tasks/${encodeURIComponent(id)}`;
export const EVENTS_DETAIL = (id: string) =>
  `${API_BASE}/events/${encodeURIComponent(id)}`;

export const taskApi = {
  async list(params?: { dateFrom?: string; dateTo?: string; calendarId?: string }): Promise<Page<Task>> {
    const qs = new URLSearchParams();
    if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params?.dateTo) qs.set("dateTo", params.dateTo);
    if (params?.calendarId) qs.set("calendarId", params.calendarId);

    return await jsonFetch<Page<Task>>(`${TASKS_LIST}?${qs.toString()}`, {
      withAuth: true,
      retryOn401: true,
    });
  },

  async create(input: {
    calendar_id: string;
    title: string;
    description?: string | null;
    due_at: string;
    status?: TaskStatus;
    priority?: TaskPriority | null;
    type?: string | null;
  }): Promise<Task> {
    return await jsonFetch<Task>(TASKS_LIST, {
      method: "POST",
      body: JSON.stringify(input),
      withAuth: true,
      retryOn401: true,
    });
  },

  async update(
    id: string,
    input: Partial<{
      title: string;
      description: string | null;
      due_at: string;
      status: TaskStatus;
      priority: TaskPriority | null;
      type: string | null;
    }>
  ): Promise<Task> {
    return await jsonFetch<Task>(TASKS_DETAIL(id), {
      method: "PATCH",
      body: JSON.stringify(input),
      withAuth: true,
      retryOn401: true,
    });
  },

  async remove(id: string): Promise<void> {
    await jsonFetch<void>(TASKS_DETAIL(id), { method: "DELETE", withAuth: true, retryOn401: true });
  },

  // completed 토글: 서버가 status 기반이면 여기서 매핑
  async toggleComplete(id: string, completed: boolean): Promise<Task> {
    const nextStatus: TaskStatus = completed ? "COMPLETED" : "PENDING";
    return await taskApi.update(id, { status: nextStatus });
  },
};

// notes는 서버 스펙 확정 전까지 최소치만
export const notesApi = {
  async create(input: { calendar_id: string; date: string; title?: string | null; memo?: string | null }): Promise<Note> {
    return await jsonFetch<Note>(NOTES_CREATE, {
      method: "POST",
      body: JSON.stringify(input),
      withAuth: true,
      retryOn401: true,
    });
  },

  async update(
    id: string,
    input: Partial<{ title: string | null; memo: string | null }>
  ): Promise<Note> {
    // eslint-disable-next-line no-console
    console.warn("notesApi.update is TODO (server endpoint required)", id, input);
    throw new Error("notes update endpoint is not available (TODO)");
  },

  async remove(id: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.warn("notesApi.remove is TODO (server endpoint required)", id);
    throw new Error("notes delete endpoint is not available (TODO)");
  },
};
