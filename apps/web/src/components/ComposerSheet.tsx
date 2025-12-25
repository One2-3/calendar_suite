// apps/web/src/components/ComposerSheet.tsx
import { useMemo, useState } from "react";
import type { Event, Task } from "../lib/api";
import { eventsApi, notesApi, taskApi } from "../lib/api";
import { localDateTimeToSend } from "../lib/datetime";
import { formatApiError } from "../lib/error";

export default function ComposerSheet(props: {
  open: boolean;
  dateISO: string;
  defaultCalendarId: string | null;
  onClose: () => void;
  onSaved?: () => void;
  upsertEvent: (e: Event) => void; // ✅ any 제거
  upsertTask: (t: Task) => void; // ✅ any 제거
}) {
  const { open, dateISO: selectedDateISO, defaultCalendarId, onClose, onSaved, upsertEvent, upsertTask } = props;

  const [tab, setTab] = useState<"event" | "task" | "memo">("event");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [eventTitle, setEventTitle] = useState("");
  const [eventMemo, setEventMemo] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startAt, setStartAt] = useState(() => `${selectedDateISO}T09:00`);
  const [endAt, setEndAt] = useState(() => `${selectedDateISO}T10:00`);

  const [taskTitle, setTaskTitle] = useState("");
  const [dueAt, setDueAt] = useState(selectedDateISO);

  const [memoTitle, setMemoTitle] = useState("");
  const [memoBody, setMemoBody] = useState("");

  const calId = useMemo(() => defaultCalendarId ?? "", [defaultCalendarId]);

  if (!open) return null;

  async function save() {
    if (!calId) {
      setErr("기본 캘린더가 필요해요");
      return;
    }

    setSaving(true);
    setErr(null);

    try {
      if (tab === "event") {
        const title = eventTitle.trim();
        if (!title) throw new Error("일정 제목을 입력해줘");

        const created = await eventsApi.create({
          calendar_id: calId,
          title,
          description: eventMemo.trim() || null,
          is_all_day: allDay,
          start_at: localDateTimeToSend(startAt),
          end_at: localDateTimeToSend(endAt),
        });

        upsertEvent(created);
        onClose();
        onSaved?.();
        return;
      }

      if (tab === "task") {
        const title = taskTitle.trim();
        if (!title) throw new Error("할일 제목을 입력해줘");

        const due_at = `${(dueAt || selectedDateISO).slice(0, 10)}T00:00:00.000Z`;

        const created = await taskApi.create({
          calendar_id: calId,
          title,
          description: null,
          due_at,
          status: "PENDING",
          priority: null,
          type: undefined, // ✅ null → undefined (스샷 에러 제거)
        });

        upsertTask(created);
        onClose();
        onSaved?.();
        return;
      }

      // memo
      const title = memoTitle.trim() || memoBody.trim();
      if (!title) throw new Error("메모 내용을 입력해줘");

      try {
        // notes endpoint가 있으면 notes로 생성
        await notesApi.create({
          calendar_id: calId,
          date: selectedDateISO.slice(0, 10), // ✅ YYYY-MM-DD
          title,
          memo: memoBody.trim() || undefined,
        });

        // notes는 현재 월 데이터에 합쳐진 구조가 없을 수 있음(현재 tasks 기반이면 즉시 반영 불가)
        // TODO: 서버에서 notes list를 제공하면 여기서도 upsert 가능
      } catch {
        // 없으면 task(type=MEMO)로 fallback
        const created = await taskApi.create({
          calendar_id: calId,
          title,
          description: memoBody.trim() || null,
          due_at: `${selectedDateISO.slice(0, 10)}T00:00:00.000Z`,
          status: "PENDING",
          priority: null,
          type: "MEMO",
        });
        upsertTask(created);
      }

      onClose();
      onSaved?.();
    } catch (e) {
      const fe = formatApiError(e);
      setErr(fe.body ?? fe.title);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div className="sheet-title">{selectedDateISO}</div>
          <button className="icon-btn" onClick={onClose} aria-label="close">
            ✕
          </button>
        </div>

        <div className="sheet-tabs">
          {(["event", "task", "memo"] as const).map((t) => (
            <button key={t} className={["tab", tab === t ? "active" : ""].join(" ")} onClick={() => setTab(t)}>
              {t === "event" ? "일정" : t === "task" ? "할일" : "메모"}
            </button>
          ))}
        </div>

        <div className="sheet-body">
          {err ? <div style={{ color: "var(--danger)", marginBottom: 10 }}>{err}</div> : null}

          {tab === "event" ? (
            <>
              <label className="label">제목</label>
              <input className="input" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
              <label className="label" style={{ marginTop: 10 }}>
                메모
              </label>
              <textarea className="textarea" value={eventMemo} onChange={(e) => setEventMemo(e.target.value)} />

              <label className="check-row" style={{ marginTop: 10 }}>
                <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
                <span>종일</span>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                <div>
                  <label className="label">시작</label>
                  <input className="input" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </div>
                <div>
                  <label className="label">종료</label>
                  <input className="input" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </div>
              </div>
            </>
          ) : tab === "task" ? (
            <>
              <label className="label">제목</label>
              <input className="input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              <label className="label" style={{ marginTop: 10 }}>
                날짜
              </label>
              <input className="input" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </>
          ) : (
            <>
              <label className="label">제목</label>
              <input className="input" value={memoTitle} onChange={(e) => setMemoTitle(e.target.value)} />
              <label className="label" style={{ marginTop: 10 }}>
                내용
              </label>
              <textarea className="textarea" value={memoBody} onChange={(e) => setMemoBody(e.target.value)} />
            </>
          )}
        </div>

        <div className="sheet-foot">
          <button className="btn primary" onClick={() => void save()} disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
