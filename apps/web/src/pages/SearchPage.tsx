// apps/web/src/pages/SearchPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import type { Event, Task } from "../lib/api";
import { searchEvents, searchTasks } from "../lib/api";
import { isoDate } from "../lib/date";

type ResultType = "event" | "task" | "memo";

type SearchResult = {
  key: string;
  type: ResultType;
  dateISO: string; // YYYY-MM-DD
  title: string;
};

type NavState = {
  events?: Event[];
  tasks?: Task[];
  range?: { startISO: string; endISO: string };
  month?: { y: number; m: number };
};

function toDayKey(v: string | null | undefined): string {
  if (!v) return "";
  return v.length >= 10 ? v.slice(0, 10) : v;
}

function isMemoTask(t: Task): boolean {
  return (t.type ?? "").toUpperCase() === "MEMO";
}

function buildClientResults(keyword: string, events: Event[], tasks: Task[]): SearchResult[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return [];

  const out: SearchResult[] = [];

  for (const e of events) {
    const title = e.title ?? "";
    if (!title.toLowerCase().includes(q)) continue;
    const d = toDayKey(e.start_at);
    if (!d) continue;
    out.push({ key: `e:${e.id}`, type: "event", dateISO: d, title });
  }

  for (const t of tasks) {
    const title = t.title ?? "";
    if (!title.toLowerCase().includes(q)) continue;
    const d = toDayKey(t.due_at);
    if (!d) continue;
    out.push({ key: `t:${t.id}`, type: isMemoTask(t) ? "memo" : "task", dateISO: d, title });
  }

  out.sort((a, b) => (a.dateISO < b.dateISO ? -1 : a.dateISO > b.dateISO ? 1 : a.type.localeCompare(b.type)));
  return out;
}

function typeLabel(t: ResultType) {
  if (t === "event") return "일정";
  if (t === "task") return "할일";
  return "메모";
}

export default function SearchPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const state = (loc.state ?? {}) as NavState;

  const [q, setQ] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // fallback data (현재 월 데이터)
  const fallbackEvents = useMemo(() => state.events ?? [], [state.events]);
  const fallbackTasks = useMemo(() => state.tasks ?? [], [state.tasks]);

  const [remote, setRemote] = useState<{ events: Event[]; tasks: Task[] } | null>(null);

  // keyword 서버 검색 (가능하면)
  useEffect(() => {
    const keyword = q.trim();
    if (!keyword) {
      setRemote(null);
      setErr(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErr(null);

    const t = window.setTimeout(() => {
      (async () => {
        try {
          const [evs, tks] = await Promise.all([searchEvents(keyword), searchTasks(keyword)]);
          if (cancelled) return;
          setRemote({ events: evs, tasks: tks });
        } catch (e) {
          if (cancelled) return;
          // 서버가 keyword 검색을 지원하지 않을 수 있음
          // TODO: 서버 스펙 확정되면 searchEvents/searchTasks 구현(쿼리 파라미터/엔드포인트)을 맞춰서 업데이트
          setRemote(null);
          setErr(e instanceof Error ? e.message : "검색 실패");
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q]);

  const results = useMemo(() => {
    const keyword = q.trim();
    if (!keyword) return [];

    // 1) remote 결과가 있으면 우선 사용
    if (remote) return buildClientResults(keyword, remote.events, remote.tasks);

    // 2) fallback(현재 월 데이터)에서 클라 필터
    return buildClientResults(keyword, fallbackEvents, fallbackTasks);
  }, [q, remote, fallbackEvents, fallbackTasks]);

  const goToDate = (dateISO: string) => {
    // /app?date=YYYY-MM-DD 로 넘기면 캘린더가 월 이동 + selected로 잡는다
    nav(`/app?date=${encodeURIComponent(dateISO)}`);
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div>
          <div className="topbar-title" style={{ fontSize: 28 }}>
            검색
          </div>
          <div className="topbar-sub">제목으로 찾기</div>
        </div>
        <button className="icon-btn" onClick={() => nav("/app")} aria-label="back">
          ←
        </button>
      </div>

      <div style={{ padding: "0 18px 14px 18px" }}>
        <input
          className="input"
          placeholder="내가 기록한 것 검색 (제목)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />

        <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 12 }}>
          {loading ? "검색 중…" : q.trim() ? `${results.length}건` : `오늘: ${isoDate(new Date())}`}
        </div>

        {err && !remote ? (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              border: "1px solid var(--line)",
              borderRadius: 14,
              color: "var(--danger)",
              background: "var(--danger-bg)",
            }}
          >
            {err}
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
              서버가 keyword 검색을 지원하지 않으면 현재 월 데이터에서만 임시로 필터됩니다.
            </div>
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {results.map((r) => (
            <button
              key={r.key}
              onClick={() => goToDate(r.dateISO)}
              style={{
                textAlign: "left",
                border: "1px solid var(--line)",
                background: "transparent",
                borderRadius: 16,
                padding: "12px 12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{r.dateISO}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    border: "1px solid var(--line)",
                    padding: "4px 8px",
                    borderRadius: 999,
                  }}
                >
                  {typeLabel(r.type)}
                </div>
              </div>
              <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>{r.title}</div>
            </button>
          ))}

          {q.trim() && !loading && results.length === 0 ? (
            <div style={{ padding: "18px 4px", color: "var(--muted)" }}>검색 결과가 없어요.</div>
          ) : null}
        </div>
      </div>

      <BottomNav onMenu={() => nav("/app")} onCompose={() => nav("/app")} onSearch={() => void 0} active="search" />
    </div>
  );
}
