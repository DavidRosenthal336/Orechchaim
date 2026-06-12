// Jewish-calendar day-type engine. Pure functions only (no DB / server-only)
// so they can be unit-tested directly.

import { HDate, getHolidaysOnDate, flags } from "@hebcal/core";
import { DateTime } from "luxon";
import { isDayType, type DayType } from "@/lib/constants";

export type DayTypeResolution = {
  /// The day-type whose checklist should be shown.
  dayType: DayType;
  /// What the day actually is, before any Bein Hazmanim remap.
  baseDayType: DayType;
  /// True when Bein Hazmanim mode changed an ordinary weekday into the
  /// lighter checklist.
  beinHazmanimApplied: boolean;
  /// Shabbos or Yom Tov (incl. Yom Kippur) — device can't be used in real
  /// time, so the checklist is filled Motzei.
  isAssurMelacha: boolean;
  /// Display strings for the Hebrew date.
  hebrewDateEn: string; // e.g. "15 Nisan 5785"
  hebrewDateHe: string; // e.g. "ט״ו ניסן תשפ״ה"
  /// Holiday names occurring on this date (e.g. ["Pesach I"]).
  holidays: string[];
};

export type ResolveOptions = {
  inIsrael?: boolean;
  beinHazmanim?: boolean;
  beinHazmanimTarget?: DayType;
};

/// Resolves the day-type for a civil date given as Y/M/D (month is 1-based).
export function resolveDayTypeForYmd(
  year: number,
  month: number,
  day: number,
  opts: ResolveOptions = {},
): DayTypeResolution {
  const inIsrael = opts.inIsrael ?? false;
  const hd = new HDate(new Date(year, month - 1, day));
  const dow = hd.getDay(); // 0 = Sunday … 6 = Saturday

  const events = getHolidaysOnDate(hd, inIsrael) ?? [];
  let isYomTov = false;
  let isCholHamoed = false;
  let isRoshChodesh = false;
  for (const ev of events) {
    const f = ev.getFlags();
    if (f & flags.CHAG) isYomTov = true;
    if (f & flags.CHOL_HAMOED) isCholHamoed = true;
    if (f & flags.ROSH_CHODESH) isRoshChodesh = true;
  }

  // Precedence (highest first). Shabbos outranks Chol Hamoed; Yom Tov tops all.
  let baseDayType: DayType;
  if (isYomTov) baseDayType = "YOM_TOV";
  else if (dow === 6) baseDayType = "SHABBOS";
  else if (isCholHamoed) baseDayType = "CHOL_HAMOED";
  else if (dow === 5) baseDayType = "EREV_SHABBOS";
  else if (isRoshChodesh) baseDayType = "ROSH_CHODESH";
  else if (dow === 0) baseDayType = "SUNDAY";
  else baseDayType = "WEEKDAY";

  // Bein Hazmanim: ordinary weekdays mirror the lighter day's checklist.
  const target =
    opts.beinHazmanimTarget && isDayType(opts.beinHazmanimTarget)
      ? opts.beinHazmanimTarget
      : "SUNDAY";
  const beinHazmanimApplied = Boolean(opts.beinHazmanim) && baseDayType === "WEEKDAY";
  const dayType = beinHazmanimApplied ? target : baseDayType;

  return {
    dayType,
    baseDayType,
    beinHazmanimApplied,
    isAssurMelacha: baseDayType === "YOM_TOV" || baseDayType === "SHABBOS",
    hebrewDateEn: `${hd.getDate()} ${hd.getMonthName()} ${hd.getFullYear()}`,
    hebrewDateHe: hd.renderGematriya(),
    holidays: events.map((ev) => ev.getDesc()),
  };
}

/// Resolves the day-type for a "YYYY-MM-DD" civil date key.
export function resolveDayType(
  dateKey: string,
  opts: ResolveOptions = {},
): DayTypeResolution {
  const { year, month, day } = parseDateKey(dateKey);
  return resolveDayTypeForYmd(year, month, day, opts);
}

/// "YYYY-MM-DD" for the current civil date in a given timezone.
export function todayKey(timezone: string, now: Date = new Date()): string {
  return DateTime.fromJSDate(now, { zone: timezone }).toFormat("yyyy-MM-dd");
}

export function parseDateKey(dateKey: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = dateKey.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }
  return { year: y, month: m, day: d };
}

/// Human-friendly civil date, e.g. "Tuesday, June 10".
export function formatCivilDate(dateKey: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  return DateTime.fromObject({ year, month, day }).toFormat("cccc, LLLL d");
}
