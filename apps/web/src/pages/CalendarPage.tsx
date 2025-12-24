import { useEffect, useMemo, useState } from "react";
import BottomNav from "../components/BottomNav";
import SideDrawer from "../components/SideDrawer";
import ComposerModal from "../components/ComposerModal";
import SearchModal from "../components/SearchModal";
import MonthGrid from "../components/Calendar/MonthGrid";
import PeriodBars from "../components/Calendar/PeriodBars";
import { calendarApi, Calendar, eventApi, Event, taskApi, Task } from "../lib/api";
import { buildMonthGrid, isoDate, monthTitle } from "../lib/date";

type LoadState = "idle" | "loading" | "ready" | "error";

export default function CalendarPage() {
  const now = new Date();
  const [ym, setYm] = useState<{ y: number; m: number }>({ y: now.getFullYear(), m: now.getMonth() + 1 });

  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [enabledCalIds, setEnabledCalIds] = useState<Record<string, boolean>>({});

  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const { rows } = useMemo(() => buildMonthGrid(ym.y, ym.m), [ym.y, ym.m]);
  const range = useMemo(() => {
    const start = rows[0][0].date;
    const end = rows[5][6].date;
    return { startISO: isoDate(start), endISO: isoDate(end) };
  }, [rows]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pickedISO, setPickedISO] = useState<string>(() => isoDate(new Date()));

  const enabledIds = useMemo(() => {
    const ids = calendars.map((c) => c.id);
    if (!ids.length) return [];
    const anyEnabled = Object.keys(enabledCalIds).length > 0;
    if (!anyEnabled) return ids;
    return ids.filter((id) => enabledCalIds[id] ?? true);
  }, [calendars, enabledCalIds]);

  const defaultCalendarId = enabledIds[0] ?? calendars[0]?.id ?? null;

  const onPrev = () => {
    setYm((p) => {
      const m = p.m - 1;
      if (m <= 0) return { y: p.y - 1, m: 12 };
      return { y: p.y, m };
    });
  };
  const onNext = () => {
    setYm((p) => {
      const m = p.m + 1;
      if (m >= 13) return { y: p.y + 1, m: 1 };
      return { y: p.y, m };
    });
  };

  const loadCalendars = async () => {
    const res = await calendarApi.list({ page: 0, size: 100 });
    setCalendars(res.content);
    setEnabledCalIds((prev) => {
      if (Object.keys(prev).length) return prev;
      const next: Record<string, boolean> = {};
      for (const c of res.content) next[c.id] = true;
      return next;
    });
  };

  const loadMonthData = async () => {
    if (!calendars.length) return;

    setState("loading");
    setError(null);

    try {
      const ids = enabledIds.length ? enabledIds : calendars.map((c) => c.id);

      const [evs, tks] = await Promise.all([
        Promise.all(
          ids.map((id) =>
            eventApi.list({
              calendar_id: id,
              page: 0,
              size: 500,
              start_from: range.startISO,
              start_to: range.endISO,
            })
          )
        ).then((pages) => pages.flatMap((p) => p.content)),
        Promise.all(
          ids.map((id) =>
            taskApi.list({
              calendar_id: id,
              page: 0,
              size: 500,
              due_from: range.startISO,
              due_to: range.endISO,
            })
          )
        ).then((pages) => pages.flatMap((p) => p.content)),
      ]);

      setEvents(evs);
      setTasks(tks);
      setState("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
      setState("error");
    }
  };

  useEffect(() => {
    void loadCalendars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!calendars.length) return;
    void loadMonthData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym.y, ym.m, range.startISO, range.endISO, JSON.stringify(enabledIds), calendars.length]);

  const onToggleCalendar = (id: string, enabled: boolean) => {
    setEnabledCalIds((prev) => ({ ...prev, [id]: enabled }));
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div>
          <div className="topbar-title">{monthTitle(ym.y, ym.m)}</div>
          <div className="topbar-sub">
            <button className="icon-btn" onClick={onPrev} aria-label="prev month">
              ←
            </button>
            <button className="icon-btn" onClick={onNext} aria-label="next month">
              →
            </button>
            <span style={{ marginLeft: 8 }}>
              {range.startISO} ~ {range.endISO}
            </span>
          </div>
        </div>
        <div className="topbar-sub">{state === "loading" ? "불러오는 중…" : ""}</div>
      </div>

      <div className="weekdays">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div key={d} className={["weekday", i === 0 ? "sun" : ""].join(" ")}>
            {d}
          </div>
        ))}
      </div>

      <div className="month-wrap">
        <PeriodBars rows={rows} events={events} />
        <MonthGrid
          rows={rows}
          events={events}
          tasks={tasks}
          onPickDate={(iso) => {
            setPickedISO(iso);
            setComposerOpen(true);
          }}
        />

        {error ? <div style={{ padding: "10px 12px", color: "var(--danger)" }}>{error}</div> : null}
      </div>

      <BottomNav onMenu={() => setDrawerOpen(true)} onCompose={() => setComposerOpen(true)} onSearch={() => setSearchOpen(true)} />

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        calendars={calendars}
        enabledCalendarIds={enabledCalIds}
        onToggleCalendar={onToggleCalendar}
      />

      <ComposerModal
        open={composerOpen}
        dateISO={pickedISO}
        defaultCalendarId={defaultCalendarId}
        onClose={() => setComposerOpen(false)}
        onCreated={() => void loadMonthData()}
      />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} events={events} tasks={tasks} />
    </div>
  );
}
