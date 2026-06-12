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
  | "ONES_PENDING"
  | "MISSED"
  | "ASSUR_WAIT"
  | "NO_CHECKLIST";

export type BoardDay = {
  dateKey: string;
  dayType: DayType;
  label: string;
  status: DayBoardStatus;
  completed: number;
  target: number;
  onesStatus: string | null;
  isAssurMelacha: boolean;
};

/// Talmidim linked to a rebbe.
export async function getTalmidim(rebbeId: string) {
  return db.user.findMany({
    where: { rebbeId },
    orderBy: { createdAt: "asc" },
  });
}

/// Per-day board for one student's week.
export async function getWeekBoard(
  student: StudentRecord,
  weekStart: string,
  now: Date = new Date(),
): Promise<BoardDay[]> {
  const opts = resolveOptsFor(student);
  const dayKeys = weekDayKeys(weekStart);

  const entries = await db.dayEntry.findMany({
    where: { userId: student.id, dateKey: { in: dayKeys } },
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
    const label = resolution.holidays[0] ?? DAY_TYPE_LABELS[dayType];

    let status: DayBoardStatus;
    if (entry) {
      if (entry.onesStatus === "PENDING") status = "ONES_PENDING";
      else if (entry.status === "SUBMITTED") status = entry.met ? "GOOD" : "SHORT";
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
      status,
      completed: entry?.completedCount ?? 0,
      target: entry?.targetCount ?? 0,
      onesStatus: entry?.onesStatus ?? null,
      isAssurMelacha: resolution.isAssurMelacha,
    };
  });
}

/// Pending אונס requests for a student, newest first.
export async function getPendingOnes(studentId: string) {
  return db.dayEntry.findMany({
    where: { userId: studentId, onesStatus: "PENDING" },
    orderBy: { dateKey: "desc" },
    select: {
      id: true,
      dateKey: true,
      hebrewDate: true,
      dayType: true,
      onesReason: true,
      completedCount: true,
      targetCount: true,
    },
  });
}

export type WeekSummary = {
  weekStart: string;
  daysTracked: number;
  daysMet: number;
  onesPending: number;
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
    select: { dateKey: true, status: true, met: true, onesStatus: true },
  });

  const summaries: WeekSummary[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekStart = shiftWeeks(currentWeek, -i);
    const days = new Set(weekDayKeys(weekStart));
    const inWeek = entries.filter((e) => days.has(e.dateKey));
    summaries.push({
      weekStart,
      daysTracked: inWeek.filter((e) => e.status === "SUBMITTED").length,
      daysMet: inWeek.filter((e) => e.status === "SUBMITTED" && e.met).length,
      onesPending: inWeek.filter((e) => e.onesStatus === "PENDING").length,
    });
  }
  return summaries;
}

/// Loads a student owned by this rebbe, or null.
export async function getOwnedStudent(rebbeId: string, studentId: string) {
  return db.user.findFirst({ where: { id: studentId, rebbeId } });
}
