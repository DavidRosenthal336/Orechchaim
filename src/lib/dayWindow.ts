// Pure day-lifecycle math (no DB / server-only) so it can be unit-tested.
// Determines when a given civil date is fillable, including the Motzei unlock
// for Shabbos/Yom Tov and the honesty grace window.

import { DateTime } from "luxon";
import { resolveDayType, parseDateKey, todayKey, type ResolveOptions } from "@/lib/calendar";
import { isDayType } from "@/lib/constants";

// Approximate Motzei (nightfall) when assur-melacha days become fillable.
// Conservative fixed local time; refined with real zmanim once a precise
// location is collected. Never unlocks during the day itself.
export const MOTZEI_HOUR = 20;
export const MOTZEI_MIN = 30;

// Days after a day's "fill day" that it stays editable (honesty window).
export const GRACE_DAYS = 1;

export type DayUserSettings = {
  id: string;
  timezone: string;
  inIsrael: boolean;
  beinHazmanimMode: boolean;
  beinHazmanimTargetType: string;
};

export function resolveOptsFor(user: DayUserSettings): ResolveOptions {
  return {
    inIsrael: user.inIsrael,
    beinHazmanim: user.beinHazmanimMode,
    beinHazmanimTarget: isDayType(user.beinHazmanimTargetType)
      ? user.beinHazmanimTargetType
      : "SUNDAY",
  };
}

export function addDaysToKey(dateKey: string, n: number): string {
  const { year, month, day } = parseDateKey(dateKey);
  return DateTime.fromObject({ year, month, day })
    .plus({ days: n })
    .toFormat("yyyy-MM-dd");
}

function startOfLocalDay(dateKey: string, tz: string): DateTime {
  const { year, month, day } = parseDateKey(dateKey);
  return DateTime.fromObject({ year, month, day }, { zone: tz }).startOf("day");
}

function endOfLocalDay(dateKey: string, tz: string): DateTime {
  return startOfLocalDay(dateKey, tz).endOf("day");
}

/// Last consecutive assur-melacha date starting from (and including) dateKey.
/// Handles multi-day Yom Tov and Shabbos+Yom Tov runs.
export function assurBlockEnd(dateKey: string, opts: ResolveOptions): string {
  let end = dateKey;
  for (let i = 0; i < 7; i++) {
    const next = addDaysToKey(end, 1);
    if (resolveDayType(next, opts).isAssurMelacha) end = next;
    else break;
  }
  return end;
}

/// The day on which an entry is actually filled in: itself for ordinary days,
/// or the end of the assur block (Motzei) for Shabbos/Yom Tov.
export function fillDayKey(
  dateKey: string,
  isAssurMelacha: boolean,
  opts: ResolveOptions,
): string {
  return isAssurMelacha ? assurBlockEnd(dateKey, opts) : dateKey;
}

export function motzeiUnlock(blockEndKey: string, tz: string): Date {
  return startOfLocalDay(blockEndKey, tz)
    .set({ hour: MOTZEI_HOUR, minute: MOTZEI_MIN })
    .toJSDate();
}

export type DayWindowState = "FUTURE" | "ASSUR_WAIT" | "OPEN" | "PAST";

export type DayWindow = {
  state: DayWindowState;
  unlocksAt: Date | null;
  locksAt: Date;
};

/// Whether a given date is fillable right now for this user.
export function computeDayWindow(
  dateKey: string,
  isAssurMelacha: boolean,
  user: DayUserSettings,
  now: Date = new Date(),
): DayWindow {
  const tz = user.timezone;
  const opts = resolveOptsFor(user);
  const today = todayKey(tz, now);

  const fillKey = fillDayKey(dateKey, isAssurMelacha, opts);
  const unlocksAt = isAssurMelacha ? motzeiUnlock(fillKey, tz) : null;
  const locksAt = endOfLocalDay(addDaysToKey(fillKey, GRACE_DAYS), tz).toJSDate();
  const nowMs = now.getTime();

  let state: DayWindowState;
  if (dateKey > today) state = "FUTURE";
  else if (unlocksAt && nowMs < unlocksAt.getTime()) state = "ASSUR_WAIT";
  else if (nowMs > locksAt.getTime()) state = "PAST";
  else state = "OPEN";

  return { state, unlocksAt, locksAt };
}
