import { useMemo } from "react";
import { Event, Task } from "../../lib/api";
import { isPast, isSunday, sameDay, isoDate } from "../../lib/date";

function pickString(o: Record<string, unknown>, key: string): string | null {
  const v = o[key];
  return typeof v === "string" ? v : null;
}

function eventStartISO(e: Event): string {
  return (typeof e.start_at === "string" ? e.start_at : null) ?? pickString(e as Record<string, unknown>, "startAt") ?? "";
}

function taskDueISO(t: Task): string {
  return (typeof t.due_at === "string" ? t.due_at : null) ?? pickString(t as Record<string, unknown>, "dueAt") ?? "";
}

function taskTitle(t: Task): string {
  const title = typeof t.title === "string" ? t.title : "";
  // memo fallback: type="MEMO"면 제목이 비어도 최소 표기
  const type = pickString(t as Record<string, unknown>, "type");
  if (!title.trim() && type === "MEMO") return "메모";
  return title;
}

type Item =
  | { kind: "event"; title: string }
  | { kind: "task"; title: string; task: Task };

export default function MonthGrid(props: {
  rows: { date: Date; inMonth: boolean }[][];
  events: Event[];
  tasks: Task[];
  selectedISO: string;
  onPickDate: (iso: string) => void;
}) {
  const today = useMemo(() => new Date(), []);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, Event[]>();
    for (const e of props.events) {
      const start = eventStartISO(e);
      const k = start.slice(0, 10);
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
      const due = taskDueISO(t);
      const k = due.slice(0, 10);
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
          ...dayTasks.map((t): Item => ({ kind: "task", title: taskTitle(t), task: t })),
        ].slice(0, 3);

        const isTod = sameDay(cell.date, today);
        const sun = isSunday(cell.date);
        const selected = iso === props.selectedISO;

        return (
          <button
            key={iso}
            type="button"
            className={["day-cell", selected ? "selected" : ""].join(" ")}
            onClick={() => props.onPickDate(iso)}
            aria-label={`${iso} 선택`}
          >
            <div className="day-head">
              <div className={["day-num", !cell.inMonth ? "muted" : "", sun ? "sun" : ""].join(" ")}>
                {cell.date.getDate()}
              </div>
              {isTod ? <div className="today-pill">오늘</div> : null}
            </div>

            <div className="chips">
              {items.map((it, idx) => {
                const dueISO = it.kind === "task" ? taskDueISO(it.task) : "";
                const status = it.kind === "task" ? pickString(it.task as Record<string, unknown>, "status") : null;

                // 미완료 + 지난 할일 => danger
                const danger =
                  it.kind === "task" &&
                  status !== "COMPLETED" &&
                  !!dueISO &&
                  isPast(new Date(dueISO), today);

                return (
                  <div key={idx} className={["chip", danger ? "danger" : ""].join(" ")}>
                    <span className="dot" />
                    <span className="label">{it.title}</span>
                  </div>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
