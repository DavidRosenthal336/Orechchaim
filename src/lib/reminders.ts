import "server-only";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/calendar";
import { sendReminder } from "@/lib/email";
import { getAppUrl } from "@/lib/appUrl";

/// Sends a reminder to each opted-in student whose local time has reached
/// their reminder hour and who hasn't filled in today yet. De-duped to once
/// per local day via lastReminderDateKey. Intended to run hourly.
export async function sendDueReminders(
  now: Date = new Date(),
): Promise<{ sent: number }> {
  const base = getAppUrl();
  const students = await db.user.findMany({
    where: { role: "STUDENT", reminderOptIn: true },
  });

  let sent = 0;
  for (const student of students) {
    const local = DateTime.fromJSDate(now, { zone: student.timezone });
    if (local.hour !== student.reminderHour) continue;

    const dateKey = todayKey(student.timezone, now);
    if (student.lastReminderDateKey === dateKey) continue; // already handled today

    const entry = await db.dayEntry.findUnique({
      where: { userId_dateKey: { userId: student.id, dateKey } },
      select: { status: true },
    });

    // Record that we've handled today's reminder regardless, to avoid re-sends.
    await db.user.update({
      where: { id: student.id },
      data: { lastReminderDateKey: dateKey },
    });

    if (entry?.status === "SUBMITTED") continue; // nothing to nudge

    await sendReminder(student.email, student.name ?? "", `${base}/today`);
    sent++;
  }

  return { sent };
}
