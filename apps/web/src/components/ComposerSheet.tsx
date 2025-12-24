import { useState } from "react";

export default function ComposerSheet(props: {
  open: boolean;
  onClose: () => void;
  defaultDateISO?: string;
}) {
  const { open, onClose, defaultDateISO } = props;
  const [text, setText] = useState("");

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="작성">
      <div className="modal">
        <div className="modal-head">
          <div className="modal-title">작성</div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 10 }}>
            선택 날짜: <b>{defaultDateISO ?? "(미지정)"}</b>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="일정/할일/메모를 입력하세요 (TODO: 서버 연동)"
            style={{
              width: "100%",
              minHeight: 120,
              resize: "none",
              borderRadius: 12,
              border: "1px solid var(--border)",
              padding: 12,
              background: "var(--card)",
              color: "var(--fg)",
              outline: "none",
            }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button className="btn" type="button" onClick={onClose}>
              닫기
            </button>
            <button
              className="btn primary"
              type="button"
              onClick={() => {
                // TODO: create event/task
                setText("");
                onClose();
              }}
            >
              저장(임시)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
