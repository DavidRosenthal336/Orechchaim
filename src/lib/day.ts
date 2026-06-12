import "server-only";
import { db } from "@/lib/db";
import { resolveDayType, todayKey } from "@/lib/calendar";
import { isDayType, type DayType } from "@/lib/constants";
import {
  computeDayWindow,
  fillDayKey,
  motzeiUnlock,
  resolveOptsFor,
  addDaysToKey,
  GRACE_DAYS,
  type DayUserSettings,
} from "@/lib/dayWindow";

export type { DayUserSettings } from "@/lib/dayWindow";

export type LoadedDay = Awaited<ReturnType<typeof loadDay>>;

/// Resolves a day for a user: its day-type, the assigned checklist, the
/// (lazily created) entry with item snapshots, and its fillable state.
export async function loadDay(user: DayUserSettings, dateKey: string) {
  const opts = resolveOptsFor(user);
  const resolution = resolveDayType(dateKey, opts);

  const existing = await db.dayEntry.findUnique({
    where: { userId_dateKey: { userId: user.id, dateKey } },
    include: { checks: { orderBy: { order: "asc" } }, template: true },
  });

  // Effective day-type respects a manual override stored on the entry.
  const effectiveDayType: DayType =
    existing?.overriddenDayType && isDayType(existing.overriddenDayType)
      ? existing.overriddenDayType
      : resolution.dayType;

  const window = computeDayWindow(dateKey, resolution.isAssurMelacha, user);

  if (existing) {
    return {
      dateKey,
      resolution,
      effectiveDayType,
      entry: existing,
      template: existing.template,
      window,
    };
  }

  const assignment = await db.dayTypeAssignment.findUnique({
    where: { userId_dayType: { userId: user.id, dayType: effectiveDayType } },
  });

  const template = assignment
    ? await db.checklistTemplate.findFirst({
        where: { id: assignment.templateId, isArchived: false },
        include: {
          items: { where: { isArchived: false }, orderBy: { order: "asc" } },
        },
      })
    : null;

  return {
    dateKey,
    resolution,
    effectiveDayType,
    entry: null,
    template,
    window,
  };
}

/// Creates the entry + item snapshot for a day (idempotent). Call when the
/// user actually opens a fillable day.
export async function ensureDayEntry(user: DayUserSettings, dateKey: string) {
  const loaded = await loadDay(user, dateKey);
  if (loaded.entry) return loaded.entry;
  if (!loaded.template) return null; // no checklist assigned for this day-type

  const { resolution, effectiveDayType, template } = loaded;
  const items = "items" in template ? template.items : [];
  const unlocksAt = resolution.isAssurMelacha
    ? motzeiUnlock(fillDayKey(dateKey, true, resolveOptsFor(user)), user.timezone)
    : null;

  try {
    return await db.dayEntry.create({
      data: {
        userId: user.id,
        dateKey,
        hebrewDate: resolution.hebrewDateEn,
        dayType: effectiveDayType,
        templateId: template.id,
        targetCount: template.targetCount,
        unlocksAt,
        checks: {
          create: items.map((it, i) => ({
            itemId: it.id,
            itemLabel: it.label,
            order: i,
          })),
        },
      },
      include: { checks: { orderBy: { order: "asc" } }, template: true },
    });
  } catch {
    return db.dayEntry.findUnique({
      where: { userId_dateKey: { userId: user.id, dateKey } },
      include: { checks: { orderBy: { order: "asc" } }, template: true },
    });
  }
}

/// Recomputes completedCount + met for an entry from its current checks.
export async function recomputeEntry(dayEntryId: string): Promise<void> {
  const entry = await db.dayEntry.findUnique({
    where: { id: dayEntryId },
    include: { checks: true },
  });
  if (!entry) return;
  const completedCount = entry.checks.filter((c) => c.checked).length;
  const met =
    (entry.targetCount > 0 && completedCount >= entry.targetCount) ||
    entry.onesStatus === "ACCEPTED";
  await db.dayEntry.update({
    where: { id: dayEntryId },
    data: { completedCount, met },
  });
}

/// Recent days (excluding today) that are unlocked, within grace, and not yet
/// submitted — surfaced as "catch up" prompts (e.g. fill Shabbos Motzei).
export async function getCatchUpDays(
  user: DayUserSettings,
  now: Date = new Date(),
) {
  const today = todayKey(user.timezone, now);
  const opts = resolveOptsFor(user);
  const results: { dateKey: string; label: string; isAssurMelacha: boolean }[] = [];

  for (let i = 1; i <= GRACE_DAYS + 2; i++) {
    const dateKey = addDaysToKey(today, -i);
    const resolution = resolveDayType(dateKey, opts);
    const window = computeDayWindow(dateKey, resolution.isAssurMelacha, user, now);
    if (window.state !== "OPEN") continue;

    const entry = await db.dayEntry.findUnique({
      where: { userId_dateKey: { userId: user.id, dateKey } },
      select: { status: true },
    });
    if (entry?.status === "SUBMITTED") continue;

    const assignment = await db.dayTypeAssignment.findUnique({
      where: { userId_dayType: { userId: user.id, dayType: resolution.dayType } },
    });
    if (!assignment) continue;

    results.push({
      dateKey,
      label: resolution.holidays[0] ?? resolution.hebrewDateEn,
      isAssurMelacha: resolution.isAssurMelacha,
    });
  }
  return results;
}
