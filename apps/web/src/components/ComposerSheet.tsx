import { useMemo, useState } from "react";
import { useCalendarState } from "../contexts/CalendarContext";
import { calendarApi } from "../lib/api";
import { dateISOToLocalDateTimeEnd, dateISOToLocalDateTimeStart, localDateTimeToSend } from "../lib/datetime";
import { formatApiError } from "../lib/error";

type Tab = "event" | "task" | "memo";

export default function ComposerSheet(props: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  selectedDateISO: string; // YYYY-MM-DD
}) {
  const { open, onClose, onSaved, selectedDateISO } = props;
  const { upsertEvent, upsertTask } = useCalendarState();

  const [tab, setTab] = useState<Tab>("event");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<{ title: string; body?: string } | null>(null);

  // event
  const [eventTitle, setEventTitle] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [eventMemo, setEventMemo] = useState("");

  // task
  const [taskTitle, setTaskTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  // memo
  const [memoTitle, setMemoTitle] = useState("");
  const [memoBody, setMemoBody] = useState("");

  useMemo(() => {
    if (!open) return;
    setErr(null);
    setStartAt(dateISOToLocalDateTimeStart(selectedDateISO));
    setEndAt(dateISOToLocalDateTimeEnd(selectedDateISO));
    setDueAt(selectedDateISO);
  }, [open, selectedDateISO]);

  if (!open) return null;

  async function save() {
    setSaving(true);
    setErr(null);

    try {
      if (tab === "event") {
        const title = eventTitle.trim();
        if (!title) throw new Error("일정 제목을 입력해줘");

        const payload = {
          title,
          allDay,
          startAt: localDateTimeToSend(startAt),
          endAt: localDateTimeToSend(endAt),
          memo: eventMemo.trim() || undefined,
        };

        const created = await calendarApi.createEvent(payload);

        // ✅ 즉시 반영 (api.ts가 이미 normalize해서 start_at/end_at가 채워짐)
        upsertEvent(created);

        onClose();
        onSaved?.();
        return;
      }

      if (tab === "task") {
        const title = taskTitle.trim();
        if (!title) throw new Error("할일 제목을 입력해줘");

        const created = await calendarApi.createTask({
          title,
          dueAt,
          completed: false,
        });

        upsertTask(created);

        onClose();
        onSaved?.();
        return;
      }

      // memo
      const title = memoTitle.trim() || memoBody.trim();
      if (!title) throw new Error("메모 내용을 입력해줘");

      const res = await calendarApi.createNoteOrMemoFallback({
        dateISO: selectedDateISO,
        title,
        memo: memoBody.trim() || undefined,
      });

      // memo가 task로 저장된 경우만 UI에 즉시 반영(칩 표시)
      if (res.kind === "task" && res.task) {
        upsertTask(res.task);
      }

      onClose();
      onSaved?.();
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <div className="sheet-date">{selectedDateISO}</div>
          <button className="sheet-x" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="sheet-tabs" role="tablist" aria-label="기록 종류">
          <button className={"tab" + (tab === "event" ? " active" : "")} onClick={() => setTab("event")} type="button">
            일정
          </button>
          <button className={"tab" + (tab === "task" ? " active" : "")} onClick={() => setTab("task")} type="button">
            할일
          </button>
          <button className={"tab" + (tab === "memo" ? " active" : "")} onClick={() => setTab("memo")} type="button">
            메모
          </button>
        </div>

        {err ? (
          <div className="sheet-error">
            <div className="sheet-error-title">{err.title}</div>
            {err.body ? <pre className="sheet-error-body">{err.body}</pre> : null}
          </div>
        ) : null}

        <div className="sheet-body">
          {tab === "event" ? (
            <div className="form">
              <label className="lbl">제목</label>
              <input className="in" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="예: 영화 예매" />

              <div className="row">
                <label className="chk">
                  <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
                  <span>하루종일</span>
                </label>
              </div>

              <label className="lbl">시작</label>
              <input className="in" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} disabled={allDay} />

              <label className="lbl">끝</label>
              <input className="in" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} disabled={allDay} />

              <label className="lbl">메모(선택)</label>
              <textarea className="ta" value={eventMemo} onChange={(e) => setEventMemo(e.target.value)} placeholder="옵션" />
            </div>
          ) : null}

          {tab === "task" ? (
            <div className="form">
              <label className="lbl">제목</label>
              <input className="in" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="예: 웹초 과제" />

              <label className="lbl">마감일</label>
              <input className="in" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
          ) : null}

          {tab === "memo" ? (
            <div className="form">
              <label className="lbl">제목(선택)</label>
              <input className="in" value={memoTitle} onChange={(e) => setMemoTitle(e.target.value)} placeholder="예: 아이디어" />

              <label className="lbl">내용</label>
              <textarea className="ta" value={memoBody} onChange={(e) => setMemoBody(e.target.value)} placeholder="메모를 입력" />
            </div>
          ) : null}
        </div>

        <div className="sheet-actions">
          <button className="btn-lite" onClick={onClose} disabled={saving}>
            취소
          </button>
          <button className="btn-solid" onClick={save} disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
