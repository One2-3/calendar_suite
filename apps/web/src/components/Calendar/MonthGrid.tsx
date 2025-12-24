import { useMemo } from "react";
import { Event, Task } from "../../lib/api";
import { isPast, isSunday, sameDay, isoDate } from "../../lib/date";

type Item =
  | { kind: "event"; title: string }
  | { kind: "task"; title: string; task: Task };

export default function MonthGrid(props: {
  rows: { date: Date; inMonth: boolean }[][];
  events: Event[];
  tasks: Task[];
  onPickDate: (iso: string) => void;
}) {
  const today = useMemo(() => new Date(), []);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, Event[]>();
    for (const e of props.events) {
      const k = (e.start_at || "").slice(0, 10);
      if (!k) continue;
      const arr = m.get(k) ?? [];
      arr.push(e);
      m.set(k, arr);
    }
    return m;
  }, [props.events]);

  const tasksByDate = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of props.tasks) {
      const k = (t.due_at || "").slice(0, 10);
      if (!k) continue;
      const arr = m.get(k) ?? [];
      arr.push(t);
      m.set(k, arr);
    }
    return m;
  }, [props.tasks]);

  return (
    <div className="month-grid">
      {props.rows.flat().map((cell) => {
        const iso = isoDate(cell.date);
        const dayEvents = eventsByDate.get(iso) ?? [];
        const dayTasks = tasksByDate.get(iso) ?? [];

        const items: Item[] = [
          ...dayEvents.map((e): Item => ({ kind: "event", title: e.title })),
          ...dayTasks.map((t): Item => ({ kind: "task", title: t.title, task: t })),
        ].slice(0, 3);

        const isTod = sameDay(cell.date, today);
        const sun = isSunday(cell.date);

        return (
          <div
            key={iso}
            className="day-cell"
            onClick={() => props.onPickDate(iso)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") props.onPickDate(iso);
            }}
          >
            <div className="day-head">
              <div className={["day-num", !cell.inMonth ? "muted" : "", sun ? "sun" : ""].join(" ")}>
                {cell.date.getDate()}
              </div>
              {isTod ? <div className="today-pill">오늘</div> : null}
            </div>

            <div className="chips">
              {items.map((it, idx) => {
                const danger =
                  it.kind === "task" &&
                  it.task.status !== "COMPLETED" &&
                  !!it.task.due_at &&
                  isPast(new Date(it.task.due_at), today);

                return (
                  <div key={idx} className={["chip", danger ? "danger" : ""].join(" ")}>
                    <span className="dot" />
                    <span className="label">{it.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
