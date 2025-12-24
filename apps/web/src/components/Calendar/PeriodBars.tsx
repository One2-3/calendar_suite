import { useMemo } from "react";
import { Event } from "../../lib/api";
import { isoDate } from "../../lib/date";

type Bar = { row: number; c1: number; c2: number; title: string };

// CSS 변수(--c1, --c2)를 안전하게 넣기 위한 타입
type BarStyle = React.CSSProperties & {
  ["--c1"]?: number;
  ["--c2"]?: number;
};

/**
 * '느낌 우선' 기간 바:
 * - 월간 그리드 위에 같은 주(row)에서 start~end 범위를 가로 바으로 표시
 * - 겹침 처리/다층 배치는 하지 않고 단순 반복
 */
export default function PeriodBars(props: {
  rows: { date: Date; inMonth: boolean }[][];
  events: Event[];
}) {
  const bars = useMemo<Bar[]>(() => {
    const list: Bar[] = [];

    for (const e of props.events) {
      const start = e.start_at ? new Date(e.start_at) : null;
      const end = e.end_at ? new Date(e.end_at) : null;
      if (!start || !end) continue;

      const startISO = isoDate(start);
      const endISO = isoDate(end);

      // multi-day만 바 처리(하루짜리는 칩으로 충분)
      if (startISO === endISO) continue;

      for (let r = 0; r < props.rows.length; r++) {
        const row = props.rows[r];
        const rowStartISO = isoDate(row[0].date);
        const rowEndISO = isoDate(row[6].date);

        // overlap 체크 (YYYY-MM-DD 문자열 비교 OK)
        if (endISO < rowStartISO || startISO > rowEndISO) continue;

        // 시작 컬럼: row에서 startISO 이상이 처음 나오는 인덱스
        let cStart = 0;
        for (let i = 0; i < 7; i++) {
          if (isoDate(row[i].date) >= startISO) {
            cStart = i;
            break;
          }
        }

        // 종료 컬럼(포함): row에서 endISO 이하인 마지막 인덱스
        let cEndIdx = 6;
        for (let i = 6; i >= 0; i--) {
          if (isoDate(row[i].date) <= endISO) {
            cEndIdx = i;
            break;
          }
        }

        // CSS grid column은 1-based, end exclusive
        list.push({ row: r, c1: cStart + 1, c2: cEndIdx + 2, title: e.title });
      }
    }

    return list;
  }, [props.events, props.rows]);

  // index.css의 .day-cell min-height(108px) 기반 대략 위치
  const rowTop = (row: number) => row * 108;

  return (
    <div className="period-layer" aria-hidden="true">
      {bars.map((b, i) => {
        const style: BarStyle = { ["--c1"]: b.c1, ["--c2"]: b.c2 };

        return (
          <div key={`${b.row}-${i}`} className="period-row" style={{ top: rowTop(b.row) }}>
            <div className="period-bar" style={style}>
              <span className="txt">{b.title}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
