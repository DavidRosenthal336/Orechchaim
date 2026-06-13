import "server-only";
import { db } from "@/lib/db";
import { resolveDayType, todayKey } from "@/lib/calendar";
import {
  computeDayWindow,
  resolveOptsFor,
  type DayUserSettings,
} from "@/lib/dayWindow";
import { weekStartKey, weekDayKeys, shiftWeeks } from "@/lib/week";
import { DAY_TYPE_LABELS, type DayType } from "@/lib/constants";

type StudentRecord = DayUserSettings & { name: string | null; email: string };

export type DayBoardStatus =
  | "UPCOMING"
  | "OPEN"
  | "GOOD"
  | "SHORT"
  | "MISSED"
  | "ASSUR_WAIT"
  | "NO_CHECKLIST";

export type BoardDay = {
  dateKey: string;
  dayType: DayType;
  label: string;
  eventName: string | null; // set for one-off SPECIAL event days
  status: DayBoardStatus;
  completed: number;
  target: number;
  onesCount: number; // items excused (אונס) that day
  isAssurMelacha: boolean;
};

/// Per-day board for a student's week (used in their own history view).
export async function getWeekBoard(
  student: StudentRecord,
  weekStart: string,
  now: Date = new Date(),
): Promise<BoardDay[]> {
  const opts = resolveOptsFor(student);
  const dayKeys = weekDayKeys(weekStart);

  const entries = await db.dayEntry.findMany({
    where: { userId: student.id, dateKey: { in: dayKeys } },
    include: { checks: { where: { ones: true }, select: { id: true } } },
  });
  const byKey = new Map(entries.map((e) => [e.dateKey, e]));

  const assignments = await db.dayTypeAssignment.findMany({
    where: { userId: student.id },
    select: { dayType: true },
  });
  const assigned = new Set(assignments.map((a) => a.dayType));

  return dayKeys.map((dateKey) => {
    const resolution = resolveDayType(dateKey, opts);
    const dayType = resolution.dayType;
    const window = computeDayWindow(dateKey, resolution.isAssurMelacha, student, now);
    const entry = byKey.get(dateKey);
    const label =
      entry?.eventName ?? resolution.holidays[0] ?? DAY_TYPE_LABELS[dayType];

    let status: DayBoardStatus;
    if (entry) {
      if (entry.status === "SUBMITTED") status = entry.met ? "GOOD" : "SHORT";
      else if (window.state === "OPEN") status = "OPEN";
      else status = "MISSED";
    } else if (window.state === "FUTURE") {
      status = "UPCOMING";
    } else if (!assigned.has(dayType)) {
      status = "NO_CHECKLIST";
    } else if (window.state === "ASSUR_WAIT") {
      status = "ASSUR_WAIT";
    } else if (window.state === "OPEN") {
      status = "OPEN";
    } else {
      status = "MISSED";
    }

    return {
      dateKey,
      dayType,
      label,
      eventName: entry?.eventName ?? null,
      status,
      completed: entry?.completedCount ?? 0,
      target: entry?.targetCount ?? 0,
      onesCount: entry?.checks.length ?? 0,
      isAssurMelacha: resolution.isAssurMelacha,
    };
  });
}

export type WeekSummary = {
  weekStart: string;
  daysTracked: number;
  daysGood: number;
  daysShort: number;
};

/// Summary of the last `weeks` weeks for a student, newest first.
export async function getStudentHistory(
  student: StudentRecord,
  weeks = 8,
  now: Date = new Date(),
): Promise<WeekSummary[]> {
  const currentWeek = weekStartKey(todayKey(student.timezone, now));
  const earliest = shiftWeeks(currentWeek, -(weeks - 1));

  const entries = await db.dayEntry.findMany({
    where: { userId: student.id, dateKey: { gte: earliest } },
    select: { dateKey: true, status: true, met: true },
  });

  const summaries: WeekSummary[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekStart = shiftWeeks(currentWeek, -i);
    const days = new Set(weekDayKeys(weekStart));
    const submitted = entries.filter(
      (e) => days.has(e.dateKey) && e.status === "SUBMITTED",
    );
    summaries.push({
      weekStart,
      daysTracked: submitted.length,
      daysGood: submitted.filter((e) => e.met).length,
      daysShort: submitted.filter((e) => !e.met).length,
    });
  }
  return summaries;
}
