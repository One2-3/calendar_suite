// apps/web/src/pages/SearchPage.tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import type { Event, Task } from "../lib/api";
import { eventsApi, taskApi } from "../lib/api";

type ResultType = "event" | "task" | "memo";
type Result = { type: ResultType; dateISO: string; title: string; id: string };

function typeLabel(t: ResultType) {
  if (t === "event") return "일정";
  if (t === "task") return "할일";
  return "메모";
}

export default function SearchPage() {
  const nav = useNavigate();
  const loc = useLocation() as {
    state?: { events?: Event[]; tasks?: Task[]; month?: { y: number; m: number }; range?: { startISO: string; endISO: string } };
  };

  const state = loc.state ?? {};
  const canLocalSearch = !!(state.events?.length || state.tasks?.length);

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  const monthLabel = useMemo(() => {
    if (!state.month) return "";
    return `${state.month.y}-${String(state.month.m).padStart(2, "0")}`;
  }, [state.month]);

  async function runSearch(keyword: string) {
    const k = keyword.trim();
    if (!k) {
      setResults([]);
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      // 1) local search
      const local: Result[] = [];
      if (canLocalSearch) {
        for (const e of state.events ?? []) {
          if ((e.title ?? "").toLowerCase().includes(k.toLowerCase())) {
            local.push({ type: "event", id: e.id, title: e.title, dateISO: e.start_at.slice(0, 10) });
          }
        }
        for (const t of state.tasks ?? []) {
          const isMemo = (t.type ?? "") === "MEMO";
          if ((t.title ?? "").toLowerCase().includes(k.toLowerCase())) {
            local.push({ type: isMemo ? "memo" : "task", id: t.id, title: t.title, dateISO: t.due_at.slice(0, 10) });
          }
        }
      }

      // 2) remote search (가능하면)
      // remote search (서버 검색 스펙이 불확실하니, 일단 범위 넓게 가져와서 프론트에서 필터링)
      const [evPage, tkPage] = await Promise.all([
        eventsApi.list({ dateFrom: "1970-01-01", dateTo: "2100-12-31" }),
        taskApi.list({ dateFrom: "1970-01-01", dateTo: "2100-12-31" }),
      ]);

      const evs = evPage.content.filter((e) =>
        (e.title ?? "").toLowerCase().includes(k.toLowerCase())
      );

      const tks = tkPage.content.filter((t) =>
        (t.title ?? "").toLowerCase().includes(k.toLowerCase())
      );


      const remote: Result[] = [
        ...evs.map((e: Event) => ({
          type: "event" as const,
          id: e.id,
          title: e.title,
          dateISO: e.start_at.slice(0, 10),
        })),
        ...tks.map((t: Task) => {
          const isMemo = (t.type ?? "") === "MEMO";
          return {
            type: (isMemo ? "memo" : "task") as ResultType,
            id: t.id,
            title: t.title,
            dateISO: t.due_at.slice(0, 10),
          };
        }),
      ];

      // dedupe (type+id)
      const map = new Map<string, Result>();
      for (const r of [...local, ...remote]) map.set(`${r.type}:${r.id}`, r);

      setResults(Array.from(map.values()));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "검색 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div>
          <div className="topbar-title">검색</div>
          <div className="topbar-sub">{monthLabel ? `${monthLabel} (월 데이터 기반 검색 가능)` : ""}</div>
        </div>
        <div className="topbar-sub">{loading ? "검색 중…" : ""}</div>
      </div>

      <div style={{ padding: "12px 12px" }}>
        <input
          className="input"
          placeholder="키워드를 입력"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void runSearch(q);
          }}
        />
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => void runSearch(q)} disabled={loading}>
            검색
          </button>
          <button
            className="btn"
            onClick={() => {
              setQ("");
              setResults([]);
              setErr(null);
            }}
            disabled={loading}
          >
            초기화
          </button>
        </div>

        {err ? <div style={{ marginTop: 10, color: "var(--danger)" }}>{err}</div> : null}

        <div style={{ marginTop: 14 }}>
          {results.map((r) => (
            <button
              key={`${r.type}:${r.id}`}
              className="list-row"
              onClick={() => nav(`/app?date=${r.dateISO}`)}
              style={{ width: "100%", textAlign: "left" }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>{typeLabel(r.type)} · {r.dateISO}</div>
              <div style={{ marginTop: 2 }}>{r.title}</div>
            </button>
          ))}
          {!loading && results.length === 0 ? <div style={{ opacity: 0.6, padding: "12px 0" }}>검색 결과가 없습니다.</div> : null}
        </div>
      </div>

      <BottomNav onMenu={() => nav("/app")} onCompose={() => nav("/app")} onSearch={() => {}} />
    </div>
  );
}
