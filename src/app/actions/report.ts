"use server";

import { requireUser } from "@/lib/dal";
import { sendWeeklyReport, type WeeklyReportEmail } from "@/lib/email";
import { todayKey } from "@/lib/calendar";
import { weekStartKey, shiftWeeks, formatWeekRange } from "@/lib/week";

export type SampleReportState = { ok?: boolean; error?: string };

/// A made-up full week, so the student can see exactly what the forwarded
/// report looks like without waiting for a real week to complete.
function sampleData(studentName: string, weekRange: string): WeeklyReportEmail {
  return {
    studentName,
    weekRange,
    daysRan: 7,
    daysFilled: 6,
    checklists: [
      {
        name: "Weekday",
        occurrences: 5,
        filled: 4,
        items: [
          { label: "Hat and jacket by every minyan", done: 3, denom: 4, excused: 1 },
          { label: "Learned day and night", done: 5, denom: 5, excused: 0 },
          { label: "No talking — ברוך שאמר to חזרת הש״ץ", done: 4, denom: 5, excused: 0 },
          { label: "שומר פיו ולשונו (no mess-ups)", done: 2, denom: 5, excused: 0 },
          { label: "Said 3 first brachos out loud", done: 4, denom: 5, excused: 0 },
        ],
      },
      {
        name: "Erev Shabbos",
        occurrences: 1,
        filled: 1,
        items: [
          { label: "Chazered the parsha", done: 1, denom: 1, excused: 0 },
          { label: "Ready before shkia", done: 0, denom: 1, excused: 0 },
        ],
      },
      {
        name: "Shabbos",
        occurrences: 1,
        filled: 1,
        items: [
          { label: "Davened all three tefillos with a minyan", done: 1, denom: 1, excused: 0 },
          { label: "Learned after the seuda", done: 0, denom: 0, excused: 1 },
        ],
      },
    ],
    ones: [
      {
        date: "Tue Jul 8",
        item: "Hat and jacket by every minyan",
        reason: "away at a chasunah, no hat with me",
      },
      {
        date: "Sat Jul 12",
        item: "Learned after the seuda",
        reason: "not feeling well",
      },
    ],
  };
}

export async function sendSampleReport(
  _prev: SampleReportState,
  _formData: FormData,
): Promise<SampleReportState> {
  const user = await requireUser();
  const weekRange = formatWeekRange(
    shiftWeeks(weekStartKey(todayKey(user.timezone)), -1),
  );
  try {
    await sendWeeklyReport(user.email, sampleData(user.name ?? "", weekRange));
    return { ok: true };
  } catch {
    return { error: "Couldn't send — check that email is configured." };
  }
}
