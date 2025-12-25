// apps/web/src/components/DetailModal.tsx
import { useMemo, useState } from "react";
import { eventsApi, taskApi } from "../lib/api";
import {
  localDateTimeToSend,
  dateISOToLocalDateTimeStart,
  dateISOToLocalDateTimeEnd,
} from "../lib/datetime";
import { formatApiError } from "../lib/error";
import type { ChipTarget } from "./Calendar/MonthGrid";
import type { Event, Task } from "../lib/api";

type UpdatedPayload =
  | { kind: "event"; event: Event }
  | { kind: "task" | "memo"; task: Task };

type DeletedPayload = { kind: "event" | "task" | "memo"; id: string };

type Props = {
  open: boolean;
  target: ChipTarget | null;
  onClose: () => void;
  onUpdated: (payload: UpdatedPayload) => void;
  onDeleted: (payload: DeletedPayload) => void;
};

export default function DetailModal(props: Props) {
  const { open, target, onClose } = props;

  // ✅ null-safe
  const tgt = target;

  // ---- UI state ----
  const [saving, setSaving] = useState(false);
  const [, setEditing] = useState(false); // ✅ editing 값은 안쓰고 setter만 씀
  const [err, setErr] = useState<string | null>(null);

  const initialTitle = useMemo(() => {
    if (!tgt) return "";
    if (tgt.kind === "event") return tgt.event.title ?? "";
    return tgt.task.title ?? "";
  }, [tgt]);

  const initialDesc = useMemo(() => {
    if (!tgt) return "";
    if (tgt.kind === "event") return tgt.event.description ?? "";
    return tgt.task.description ?? "";
  }, [tgt]);

  const initialAllDay = useMemo(() => {
    if (!tgt) return false;
    if (tgt.kind === "event") return Boolean(tgt.event.is_all_day);
    return true;
  }, [tgt]);

  const initialStartISO = useMemo(() => {
    if (!tgt || tgt.kind !== "event") return "";
    return dateISOToLocalDateTimeStart(tgt.event.start_at);
  }, [tgt]);

  const initialEndISO = useMemo(() => {
    if (!tgt || tgt.kind !== "event") return "";
    return dateISOToLocalDateTimeEnd(tgt.event.end_at);
  }, [tgt]);

  const initialDueISO = useMemo(() => {
    if (!tgt || tgt.kind === "event") return "";
    return (tgt.task.due_at ?? "").slice(0, 10);
  }, [tgt]);

  const [title, setTitle] = useState(initialTitle);
  const [desc, setDesc] = useState(initialDesc);
  const [allDay, setAllDay] = useState(initialAllDay);
  const [startAt, setStartAt] = useState(initialStartISO);
  const [endAt, setEndAt] = useState(initialEndISO);
  const [dueAt, setDueAt] = useState(initialDueISO);

  async function onSave() {
    if (!tgt) return;
    setSaving(true);
    setErr(null);

    try {
      if (tgt.kind === "event") {
        const t = title.trim();
        if (!t) throw new Error("일정 제목을 입력해줘");

        const updated = await eventsApi.update(tgt.event.id, {
          title: t,
          description: desc.trim() || null,
          is_all_day: allDay,
          start_at: localDateTimeToSend(startAt),
          end_at: localDateTimeToSend(endAt),
        });

        props.onUpdated({ kind: "event", event: updated });
        setEditing(false);
        onClose();
        return;
      }

      // task / memo
      const t = title.trim();
      if (!t) {
        throw new Error(tgt.kind === "memo" ? "메모 제목/내용을 입력해줘" : "할일 제목을 입력해줘");
      }

      const dueISO =
        dueAt && dueAt.length >= 10
          ? `${dueAt.slice(0, 10)}T00:00:00.000Z`
          : `${tgt.task.due_at.slice(0, 10)}T00:00:00.000Z`;

      const updated = await taskApi.update(tgt.task.id, {
        title: t,
        description: desc.trim() || null,
        due_at: dueISO,
        type: tgt.kind === "memo" ? "MEMO" : (tgt.task.type ?? undefined),
      });

      props.onUpdated({ kind: tgt.kind, task: updated });
      setEditing(false);
      onClose();
    } catch (e) {
      const fe = formatApiError(e);
      setErr(fe.body ?? fe.title);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!tgt) return;
    const ok = window.confirm("정말 삭제할까요?");
    if (!ok) return;

    setSaving(true);
    setErr(null);

    try {
      if (tgt.kind === "event") {
        await eventsApi.remove(tgt.event.id);
        props.onDeleted({ kind: "event", id: tgt.event.id });
        onClose();
        return;
      }

      await taskApi.remove(tgt.task.id);
      props.onDeleted({ kind: tgt.kind, id: tgt.task.id });
      onClose();
    } catch (e) {
      const fe = formatApiError(e);
      setErr(fe.body ?? fe.title);
    } finally {
      setSaving(false);
    }
  }

  async function onToggleComplete() {
    if (!tgt) return;
    if (tgt.kind !== "task") return;

    setSaving(true);
    setErr(null);

    try {
      const next = tgt.task.status !== "COMPLETED";
      const updated = await taskApi.toggleComplete(tgt.task.id, next);
      props.onUpdated({ kind: "task", task: updated });
      onClose();
    } catch (e) {
      const fe = formatApiError(e);
      setErr(fe.body ?? fe.title);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  // ⚠️ 아래 렌더는 예시(너 원래 UI로 바꿔도 됨)
  return (
    <div>
      <div style={{ padding: 16 }}>
        {err ? <div style={{ marginBottom: 8 }}>{err}</div> : null}

        <div style={{ display: "grid", gap: 8 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="description" />

          {tgt?.kind === "event" ? (
            <>
              <label>
                <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
                allDay
              </label>
              <input value={startAt} onChange={(e) => setStartAt(e.target.value)} placeholder="startAt" />
              <input value={endAt} onChange={(e) => setEndAt(e.target.value)} placeholder="endAt" />
            </>
          ) : (
            <input value={dueAt} onChange={(e) => setDueAt(e.target.value)} placeholder="dueAt (YYYY-MM-DD)" />
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} disabled={saving}>
              닫기
            </button>
            <button onClick={onSave} disabled={saving || !tgt}>
              저장
            </button>
            <button onClick={onDelete} disabled={saving || !tgt}>
              삭제
            </button>
            <button onClick={onToggleComplete} disabled={saving || tgt?.kind !== "task"}>
              완료 토글
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
