// apps/web/src/components/Calendar/MonthGrid.tsx
import type { Event, Task } from "../../lib/api";

export type ChipTarget =
  | { kind: "event"; event: Event }
  | { kind: "task"; task: Task }
  | { kind: "memo"; task: Task };

type Props = {
  rows: { date: Date; inMonth: boolean }[][];
  events: Event[];
  tasks: Task[];
  selectedISO: string;
  onPickDate: (iso: string) => void;
  onPickItem?: (t: ChipTarget) => void; // ✅ 추가
};

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function MonthGrid(props: Props) {
  const { rows, events, tasks, selectedISO, onPickDate, onPickItem } = props;

  return (
    <div className="month-grid">
      {rows.map((week, wi) => (
        <div key={wi} className="week-row">
          {week.map((cell, di) => {
            const dateISO = isoDate(cell.date);
            const dayEvents = events.filter((e) => e.start_at.slice(0, 10) === dateISO);
            const dayTasks = tasks.filter((t) => t.due_at.slice(0, 10) === dateISO);

            return (
              <div
                key={di}
                className={["day-cell", cell.inMonth ? "in" : "out", dateISO === selectedISO ? "selected" : ""].join(" ")}
                onClick={() => onPickDate(dateISO)}
              >
                <div className="day-num">{cell.date.getDate()}</div>

                <div className="chips">
                  {dayEvents.map((e) => (
                    <button
                      key={e.id}
                      className="chip chip-event"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onPickItem?.({ kind: "event", event: e });
                      }}
                    >
                      {e.title}
                    </button>
                  ))}

                  {dayTasks.map((t) => {
                    const kind = (t.type ?? "").toUpperCase() === "MEMO" ? "memo" : "task";
                    return (
                      <button
                        key={t.id}
                        className={["chip", kind === "memo" ? "chip-memo" : "chip-task", t.status === "COMPLETED" ? "done" : ""].join(" ")}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onPickItem?.({ kind, task: t } as ChipTarget);
                        }}
                      >
                        {t.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
