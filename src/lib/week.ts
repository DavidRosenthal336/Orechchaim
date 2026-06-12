// Jewish-week helpers: the reporting week runs Sunday → Shabbos. Pure.

import { DateTime } from "luxon";
import { parseDateKey } from "@/lib/calendar";
import { addDaysToKey } from "@/lib/dayWindow";

/// The Sunday on or before a given date, as "YYYY-MM-DD".
export function weekStartKey(dateKey: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  const dt = DateTime.fromObject({ year, month, day });
  const offset = dt.weekday % 7; // Luxon: Sun=7→0, Mon=1→1 … Sat=6→6
  return dt.minus({ days: offset }).toFormat("yyyy-MM-dd");
}

/// The Shabbos (Saturday) ending the week that starts on weekStartKey.
export function weekEndKey(weekStartKey: string): string {
  return addDaysToKey(weekStartKey, 6);
}

/// The seven day-keys Sunday…Shabbos for a week.
export function weekDayKeys(weekStartKey: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStartKey, i));
}

/// The start of the week N weeks before the one containing dateKey.
export function shiftWeeks(weekStart: string, weeks: number): string {
  return addDaysToKey(weekStart, weeks * 7);
}

/// Human label like "Jun 8 – 14" or "Jun 29 – Jul 5".
export function formatWeekRange(weekStart: string): string {
  const start = DateTime.fromISO(weekStart);
  const end = DateTime.fromISO(weekEndKey(weekStart));
  if (start.month === end.month) {
    return `${start.toFormat("LLL d")} – ${end.toFormat("d")}`;
  }
  return `${start.toFormat("LLL d")} – ${end.toFormat("LLL d")}`;
}
