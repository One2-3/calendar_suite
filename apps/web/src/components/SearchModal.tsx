import { useMemo, useState } from "react";
import { Event, Task } from "../lib/api";

type Item =
  | { kind: "event"; id: string; title: string; dateLabel: string }
  | { kind: "task"; id: string; title: string; dateLabel: string };

export default function SearchModal(props: {
  open: boolean;
  onClose: () => void;
  events: Event[];
  tasks: Task[];
}) {
  const [q, setQ] = useState("");

  const items: Item[] = useMemo(() => {
    const evs = props.events.map((e) => ({
      kind: "event" as const,
      id: e.id,
      title: e.title,
      dateLabel: (e.start_at || "").slice(0, 10),
    }));
    const tks = props.tasks.map((t) => ({
      kind: "task" as const,
      id: t.id,
      title: t.title,
      dateLabel: (t.due_at || "").slice(0, 10),
    }));
    return [...evs, ...tks];
  }, [props.events, props.tasks]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items.slice(0, 40);
    return items.filter((it) => it.title.toLowerCase().includes(qq)).slice(0, 40);
  }, [items, q]);

  if (!props.open) return null;

  const close = () => {
    setQ("");
    props.onClose();
  };

  return (
    <div className="modal-backdrop" onClick={close} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>검색</div>

        <div className="field">
          <label>키워드</label>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목 검색" />
        </div>

        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {filtered.map((it) => (
            <div className="chip" key={`${it.kind}:${it.id}`}>
              <span className="dot" />
              <span className="label">
                [{it.kind === "event" ? "일정" : "할일"}] {it.title}
              </span>
              <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 12 }}>{it.dateLabel}</span>
            </div>
          ))}
          {!filtered.length ? <div style={{ color: "var(--muted)" }}>검색 결과 없음</div> : null}
        </div>

        <div className="actions" style={{ gridTemplateColumns: "1fr" }}>
          <button onClick={close}>닫기</button>
        </div>
      </div>
    </div>
  );
}
