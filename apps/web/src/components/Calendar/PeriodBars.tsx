import { useMemo } from "react";
import { Event } from "../../lib/api";
import { isoDate } from "../../lib/date";

function pickString(o: Record<string, unknown>, key: string): string | null {
  const v = o[key];
  return typeof v === "string" ? v : null;
}

function eventStart(e: Event): string {
  return (typeof e.start_at === "string" ? e.start_at : null) ?? pickString(e as Record<string, unknown>, "startAt") ?? "";
}

function eventEnd(e: Event): string {
  return (typeof e.end_at === "string" ? e.end_at : null) ?? pickString(e as Record<string, unknown>, "endAt") ?? "";
}

type Seg = {
  row: number;
  c1: number; // 1-based
  c2: number; // end exclusive
  title: string;
};

type Bar = Seg & { lane: number };

type BarStyle = React.CSSProperties & {
  ["--c1"]?: number;
  ["--c2"]?: number;
  ["--lane"]?: number;
};

function toDayKey(v?: string | null) {
  if (!v) return "";
  return v.length >= 10 ? v.slice(0, 10) : v;
}

/**
 * 멀티데이 바(느낌 우선):
 * - 같은 주(row)에서 start~end 범위를 가로로 연결
 * - 겹치면 lane(줄)을 하나씩 내려서 표시 (간단한 greedy)
 */
export default function PeriodBars(props: {
  rows: { date: Date; inMonth: boolean }[][];
  events: Event[];
}) {
  const bars = useMemo<Bar[]>(() => {
    const segs: Seg[] = [];

    // 1) 이벤트를 row 단위로 쪼개서 segment 생성
    for (const e of props.events) {
      const s = toDayKey(eventStart(e));
      const ed = toDayKey(eventEnd(e));
      if (!s || !ed) continue;
      if (s === ed) continue; // 하루짜리는 칩으로 표시

      for (let r = 0; r < props.rows.length; r++) {
        const row = props.rows[r];
        const rowStart = isoDate(row[0].date);
        const rowEnd = isoDate(row[6].date);
        if (ed < rowStart || s > rowEnd) continue;

        let cStart = 0;
        for (let i = 0; i < 7; i++) {
          if (isoDate(row[i].date) >= s) {
            cStart = i;
            break;
          }
        }

        let cEnd = 6;
        for (let i = 6; i >= 0; i--) {
          if (isoDate(row[i].date) <= ed) {
            cEnd = i;
            break;
          }
        }

        segs.push({ row: r, c1: cStart + 1, c2: cEnd + 2, title: e.title });
      }
    }

    // 2) row별 lane 배치 (겹치면 다음 lane)
    const grouped = new Map<number, Seg[]>();
    for (const s of segs) {
      const arr = grouped.get(s.row) ?? [];
      arr.push(s);
      grouped.set(s.row, arr);
    }

    const out: Bar[] = [];
    for (const [, list] of grouped) {
      list.sort((a, b) => (a.c1 - b.c1) || (a.c2 - b.c2));
      const lanesEnd: number[] = [];

      for (const seg of list) {
        let placed = false;
        for (let lane = 0; lane < lanesEnd.length; lane++) {
          if (lanesEnd[lane] <= seg.c1) {
            lanesEnd[lane] = seg.c2;
            out.push({ ...seg, lane });
            placed = true;
            break;
          }
        }

        if (!placed) {
          const lane = lanesEnd.length;
          lanesEnd.push(seg.c2);
          out.push({ ...seg, lane });
        }
      }
    }

    return out;
  }, [props.events, props.rows]);

  // index.css의 .day-cell min-height(108px) 기반 대략 위치
  const rowTop = (row: number) => row * 108;

  return (
    <div className="period-layer" aria-hidden="true">
      {bars.map((b, i) => {
        const style: BarStyle = { ["--c1"]: b.c1, ["--c2"]: b.c2, ["--lane"]: b.lane };
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
