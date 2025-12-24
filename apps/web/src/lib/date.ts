export type YMD = { y: number; m: number; d: number }; // m: 1-12

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toISODate({ y, m, d }: YMD) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function fromDate(date: Date): YMD {
  return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function startOfMonth(y: number, m1: number) {
  return new Date(y, m1 - 1, 1);
}

export function endOfMonth(y: number, m1: number) {
  return new Date(y, m1, 0);
}

/**
 * 월간 캘린더 6행(42칸) 그리드 생성
 * - 주 시작: 일요일
 */
export function buildMonthGrid(y: number, m1: number) {
  const first = startOfMonth(y, m1);
  const firstDow = first.getDay(); // 0=Sun
  const gridStart = addDays(first, -firstDow);

  const cells = Array.from({ length: 42 }).map((_, i) => {
    const date = addDays(gridStart, i);
    return { date, inMonth: date.getMonth() === m1 - 1 };
  });

  const rows = Array.from({ length: 6 }).map((_, r) => cells.slice(r * 7, r * 7 + 7));
  return { cells, rows, gridStart };
}

export function monthTitle(y: number, m1: number) {
  const now = new Date();
  if (y === now.getFullYear()) return `${m1}월`;
  return `${y}년 ${m1}월`;
}

export function isSunday(date: Date) {
  return date.getDay() === 0;
}

export function isPast(date: Date, today = new Date()) {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return a < b;
}

export function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
