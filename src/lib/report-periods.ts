// Date range helpers for the smart reports page.
// All dates are handled as local YYYY-MM-DD strings (no UTC drift).

export type PeriodKey = "today" | "week" | "month" | "lastmonth" | "custom";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "Bugün",
  week: "Bu Hafta",
  month: "Bu Ay",
  lastmonth: "Geçen Ay",
  custom: "Özel",
};

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date): Date {
  // Turkish convention: week starts on Monday.
  const copy = new Date(d);
  const day = copy.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  return copy;
}

export type DateRange = { from: string; to: string };

/** Resolve a period key (+ optional custom range) into concrete dates. */
export function resolveRange(
  period: PeriodKey,
  customFrom?: string,
  customTo?: string
): DateRange {
  const now = new Date();

  switch (period) {
    case "today": {
      const t = toISODate(now);
      return { from: t, to: t };
    }
    case "week": {
      const start = startOfWeek(now);
      return { from: toISODate(start), to: toISODate(now) };
    }
    case "month": {
      return {
        from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: toISODate(now),
      };
    }
    case "lastmonth": {
      return {
        from: toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: toISODate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    }
    case "custom": {
      return {
        from: customFrom && /^\d{4}-\d{2}-\d{2}$/.test(customFrom) ? customFrom : toISODate(now),
        to: customTo && /^\d{4}-\d{2}-\d{2}$/.test(customTo) ? customTo : toISODate(now),
      };
    }
  }
}

/** The equally-sized period immediately before the given range, for comparisons. */
export function previousRange({ from, to }: DateRange): DateRange {
  const f = new Date(from + "T00:00:00");
  const t = new Date(to + "T00:00:00");
  const days = Math.round((t.getTime() - f.getTime()) / 86_400_000) + 1;
  const prevTo = new Date(f);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (days - 1));
  return { from: toISODate(prevFrom), to: toISODate(prevTo) };
}

/** Inclusive list of dates between from and to (bounded, for chart x-axis). */
export function eachDay({ from, to }: DateRange): string[] {
  const out: string[] = [];
  const f = new Date(from + "T00:00:00");
  const t = new Date(to + "T00:00:00");
  for (let d = new Date(f); d <= t; d.setDate(d.getDate() + 1)) {
    out.push(toISODate(d));
    if (out.length > 400) break; // safety cap
  }
  return out;
}

export function daysCount({ from, to }: DateRange): number {
  const f = new Date(from + "T00:00:00");
  const t = new Date(to + "T00:00:00");
  return Math.round((t.getTime() - f.getTime()) / 86_400_000) + 1;
}

export function parsePeriod(v: string | undefined): PeriodKey {
  return v === "today" || v === "week" || v === "month" || v === "lastmonth" || v === "custom"
    ? v
    : "month";
}
