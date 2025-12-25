import { useMemo, useState } from "react";
import { eventsApi, taskApi, TaskPriority, TaskStatus } from "../lib/api";

type Mode = "TASK" | "EVENT" | "MEMO";

export default function ComposerModal(props: {
  open: boolean;
  dateISO: string; // YYYY-MM-DD
  defaultCalendarId: string | null; // ✅ null 허용 (CalendarPage와 일치)
  onClose: () => void;
  onCreated: () => void | Promise<void>; // ✅ async 로딩도 허용
}) {
  const [mode, setMode] = useState<Mode>("TASK");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const startDefault = useMemo(() => `${props.dateISO}T09:00:00`, [props.dateISO]);
  const endDefault = useMemo(() => `${props.dateISO}T10:00:00`, [props.dateISO]);
  const [startAt, setStartAt] = useState(startDefault);
  const [endAt, setEndAt] = useState(endDefault);

  if (!props.open) return null;

  const reset = () => {
    setMode("TASK");
    setTitle("");
    setDescription("");
    setErr(null);
    setStartAt(startDefault);
    setEndAt(endDefault);
  };

  const close = () => {
    reset();
    props.onClose();
  };

  const submit = async () => {
    setErr(null);

    if (!props.defaultCalendarId) {
      setErr("캘린더가 없습니다. (캘린더 소스를 확인하세요)");
      return;
    }
    if (!title.trim()) {
      setErr("제목을 입력하세요.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "EVENT") {
        await eventsApi.create({
          calendar_id: props.defaultCalendarId,
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          start_at: startAt,
          end_at: endAt,
          is_all_day: false,
        });
      } else {
        // MEMO 엔드포인트가 없다면 tasks로 매핑
        const status: TaskStatus = "PENDING";
        const priority: TaskPriority | null = null;

        await taskApi.create({
          calendar_id: props.defaultCalendarId,
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          due_at: `${props.dateISO}T00:00:00`,
          status,
          priority,
        });
      }

      await props.onCreated(); // ✅ void/Promise 모두 안전
      close();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={close} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>작성</div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>{props.dateISO}</div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>종류</label>
          <select className="select" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="TASK">할일</option>
            <option value="EVENT">일정</option>
            <option value="MEMO">메모</option>
          </select>
        </div>

        <div className="field">
          <label>제목</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="field">
          <label>{mode === "MEMO" ? "메모" : "설명"}</label>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {mode === "EVENT" ? (
          <>
            <div className="field">
              <label>시작(ISO)</label>
              <input className="input" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div className="field">
              <label>종료(ISO)</label>
              <input className="input" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </>
        ) : null}

        {err && <div className="login-err">{err}</div>}

        <div className="actions">
          <button onClick={close} disabled={busy}>
            취소
          </button>
          <button className="primary" onClick={submit} disabled={busy}>
            {busy ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
