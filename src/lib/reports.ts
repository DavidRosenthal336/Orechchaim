import "server-only";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/calendar";
import { weekStartKey, weekEndKey, weekDayKeys, shiftWeeks, formatWeekRange } from "@/lib/week";
import { getWeekBoard } from "@/lib/rebbe";
import { sendWeeklyReport, type WeeklyReportEmail } from "@/lib/email";

const LINE_STATUS: Record<string, string | null> = {
  GOOD: "Good day",
  SHORT: "Short",
  ONES_PENDING: "אונס — awaiting you",
  MISSED: "Missed",
  OPEN: "Missed",
  UPCOMING: null,
  ASSUR_WAIT: null,
  NO_CHECKLIST: null,
};

async function buildReportData(
  student: { id: string; name: string | null; email: string } & Parameters<
    typeof getWeekBoard
  >[0],
  weekStart: string,
  now: Date,
) {
  const dayKeys = weekDayKeys(weekStart);
  const board = await getWeekBoard(student, weekStart, now);

  const entries = await db.dayEntry.findMany({
    where: { userId: student.id, dateKey: { in: dayKeys } },
    select: { status: true, met: true, onesStatus: true },
  });

  const daysTracked = entries.filter((e) => e.status === "SUBMITTED").length;
  const daysMet = entries.filter((e) => e.status === "SUBMITTED" && e.met).length;
  const onesAccepted = entries.filter((e) => e.onesStatus === "ACCEPTED").length;
  const onesDenied = entries.filter((e) => e.onesStatus === "DENIED").length;
  const onesPending = entries.filter((e) => e.onesStatus === "PENDING").length;

  const lines = board
    .map((d) => {
      const label = LINE_STATUS[d.status];
      if (!label) return null;
      const dow = DateTime.fromISO(d.dateKey).toFormat("ccc LLL d");
      return `${dow} — ${label}`;
    })
    .filter((l): l is string => l !== null);

  return { daysTracked, daysMet, onesAccepted, onesDenied, onesPending, lines };
}

/// Generates + emails any not-yet-sent weekly reports for the most recently
/// completed week. Idempotent (WeeklyReport unique per student+week).
export async function generateAndSendWeeklyReports(
  now: Date = new Date(),
): Promise<{ sent: number; skipped: number }> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const students = await db.user.findMany({
    where: { role: "STUDENT", rebbeId: { not: null } },
  });

  let sent = 0;
  let skipped = 0;

  for (const student of students) {
    if (!student.rebbeId) continue;
    const rebbe = await db.user.findUnique({
      where: { id: student.rebbeId },
      select: { email: true },
    });
    if (!rebbe) {
      skipped++;
      continue;
    }

    // Skip students who haven't set up any checklist yet.
    const hasChecklist = await db.checklistTemplate.count({
      where: { userId: student.id, isArchived: false },
    });
    if (hasChecklist === 0) {
      skipped++;
      continue;
    }

    const completedWeekStart = shiftWeeks(
      weekStartKey(todayKey(student.timezone, now)),
      -1,
    );

    const existing = await db.weeklyReport.findUnique({
      where: {
        studentId_weekStartKey: {
          studentId: student.id,
          weekStartKey: completedWeekStart,
        },
      },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const data = await buildReportData(student, completedWeekStart, now);

    await db.weeklyReport.create({
      data: {
        studentId: student.id,
        weekStartKey: completedWeekStart,
        weekEndKey: weekEndKey(completedWeekStart),
        daysTracked: data.daysTracked,
        daysMet: data.daysMet,
        onesAccepted: data.onesAccepted,
        onesDenied: data.onesDenied,
        onesPending: data.onesPending,
        payload: JSON.stringify(data),
        sentAt: new Date(),
      },
    });

    const email: WeeklyReportEmail = {
      studentName: student.name ?? student.email,
      weekRange: formatWeekRange(completedWeekStart),
      daysMet: data.daysMet,
      daysTracked: data.daysTracked,
      onesAccepted: data.onesAccepted,
      onesPending: data.onesPending,
      lines: data.lines,
      dashboardUrl: `${base}/rebbe`,
    };
    await sendWeeklyReport(rebbe.email, email);
    sent++;
  }

  return { sent, skipped };
}
