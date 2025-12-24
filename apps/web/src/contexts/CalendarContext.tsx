/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from "react";
import { isoDate } from "../lib/date";
import type { Event, Task } from "../lib/api";

export type YM = { y: number; m: number };

export type EntryKind = "event" | "task" | "memo";
export type Entry = { id: string; kind: EntryKind; title: string; dateISO: string };

export type CalendarState = {
  selectedISO: string;
  setSelectedISO: (iso: string) => void;

  visibleYM: YM;
  setVisibleYM: React.Dispatch<React.SetStateAction<YM>>;
  moveMonth: (delta: -1 | 1) => void;

  entries: Entry[];
  setEntries: (entries: Entry[]) => void;

  // ✅ optimistic 반영용
  optimisticEvents: Event[];
  optimisticTasks: Task[];
  upsertEvent: (e: Event) => void;
  upsertTask: (t: Task) => void;
  clearOptimistic: () => void;
};

const CalendarCtx = createContext<CalendarState | null>(null);

function addMonth(ym: YM, delta: -1 | 1): YM {
  const m = ym.m + delta;
  if (m <= 0) return { y: ym.y - 1, m: 12 };
  if (m >= 13) return { y: ym.y + 1, m: 1 };
  return { y: ym.y, m };
}

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const today = useMemo(() => new Date(), []);
  const [selectedISO, setSelectedISO] = useState(() => isoDate(today));
  const [visibleYM, setVisibleYM] = useState<YM>(() => ({ y: today.getFullYear(), m: today.getMonth() + 1 }));
  const [entries, setEntries] = useState<Entry[]>([]);

  const [optimisticEvents, setOptimisticEvents] = useState<Event[]>([]);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);

  const upsertEvent = (e: Event) => {
    setOptimisticEvents((prev) => {
      const id = e.id ? String(e.id) : "";
      if (!id) return [e, ...prev];
      const idx = prev.findIndex((x) => String(x.id ?? "") === id);
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = { ...copy[idx], ...e };
        return copy;
      }
      return [e, ...prev];
    });
  };

  const upsertTask = (t: Task) => {
    setOptimisticTasks((prev) => {
      const id = t.id ? String(t.id) : "";
      if (!id) return [t, ...prev];
      const idx = prev.findIndex((x) => String(x.id ?? "") === id);
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = { ...copy[idx], ...t };
        return copy;
      }
      return [t, ...prev];
    });
  };

  const clearOptimistic = () => {
    setOptimisticEvents([]);
    setOptimisticTasks([]);
  };

  const moveMonth: CalendarState["moveMonth"] = (delta) => setVisibleYM((p) => addMonth(p, delta));

  const value: CalendarState = {
    selectedISO,
    setSelectedISO,
    visibleYM,
    setVisibleYM,
    moveMonth,
    entries,
    setEntries,
    optimisticEvents,
    optimisticTasks,
    upsertEvent,
    upsertTask,
    clearOptimistic,
  };

  return <CalendarCtx.Provider value={value}>{children}</CalendarCtx.Provider>;
}

export function useCalendarState() {
  const ctx = useContext(CalendarCtx);
  if (!ctx) throw new Error("useCalendarState must be used within CalendarProvider");
  return ctx;
}
