import "server-only";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/calendar";
import { weekStartKey, weekEndKey, shiftWeeks, formatWeekRange } from "@/lib/week";
import { getWeekBoard } from "@/lib/progress";
import { sendWeeklyReport, type WeeklyReportEmail } from "@/lib/email";

type ReportStudent = Parameters<typeof getWeekBoard>[0] & {
  name: string | null;
  email: string;
  rebbeEmail: string | null;
  rebbeName: string | null;
};

async function buildReportData(student: ReportStudent, weekStart: string, now: Date) {
  const board = await getWeekBoard(student, weekStart, now);

  let daysGood = 0;
  let daysShort = 0;
  const lines: string[] = [];

  for (const d of board) {
    const dow = DateTime.fromISO(d.dateKey).toFormat("ccc LLL d");
    const excused = d.onesCount > 0 ? ` · ${d.onesCount} excused (אונס)` : "";
    if (d.status === "GOOD") {
      daysGood++;
      lines.push(`${dow} — Good (${d.completed}/${d.target})${excused}`);
    } else if (d.status === "SHORT") {
      daysShort++;
      lines.push(`${dow} — Short (${d.completed}/${d.target})${excused}`);
    } else if (d.status === "MISSED" || d.status === "OPEN") {
      lines.push(`${dow} — Not filled in`);
    }
  }

  return { daysGood, daysShort, daysTracked: daysGood + daysShort, lines };
}

/// Generates + emails any not-yet-sent weekly reports for the most recently
/// completed week, to each student's rebbe email. Idempotent (WeeklyReport is
/// unique per student + week).
export async function generateAndSendWeeklyReports(
  now: Date = new Date(),
): Promise<{ sent: number; skipped: number }> {
  const students = await db.user.findMany({
    where: { rebbeEmail: { not: null } },
  });

  let sent = 0;
  let skipped = 0;

  for (const student of students) {
    if (!student.rebbeEmail) {
      skipped++;
      continue;
    }

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
        daysMet: data.daysGood,
        onesAccepted: 0,
        onesDenied: data.daysShort,
        onesPending: 0,
        payload: JSON.stringify(data),
        sentAt: new Date(),
      },
    });

    const email: WeeklyReportEmail = {
      studentName: student.name ?? student.email,
      weekRange: formatWeekRange(completedWeekStart),
      daysGood: data.daysGood,
      daysShort: data.daysShort,
      daysTracked: data.daysTracked,
      lines: data.lines,
    };
    await sendWeeklyReport(student.rebbeEmail, email);
    sent++;
  }

  return { sent, skipped };
}
