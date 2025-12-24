export type EntryKind = "TASK" | "EVENT" | "MEMO";

export type CalendarEntry = {
  id: string;
  kind: EntryKind;
  /** YYYY-MM-DD */
  dateISO: string;
  title: string;
  createdAt: number;
};
