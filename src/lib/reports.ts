import "server-only";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { resolveDayType, todayKey } from "@/lib/calendar";
import {
  computeDayWindow,
  resolveOptsFor,
  type DayUserSettings,
} from "@/lib/dayWindow";
import { weekStartKey, weekEndKey, weekDayKeys, shiftWeeks, formatWeekRange } from "@/lib/week";
import { DAY_TYPE_LABELS } from "@/lib/constants";
import { sendWeeklyReport, type WeeklyReportEmail } from "@/lib/email";

type ReportStudent = DayUserSettings & { name: string | null; email: string };

export type ReportItem = {
  label: string;
  done: number; // days done
  denom: number; // days it counted (occurrences minus excused)
  excused: number; // days marked אונס
};

export type ReportChecklist = {
  name: string;
  occurrences: number; // days this checklist ran this week
  filled: number; // days actually filled in
  items: ReportItem[];
};

export type ReportOnes = { date: string; item: string; reason: string | null };

/// Aggregates a student's week by checklist: for each checklist that ran, each
/// item's done/counted fraction (excused days drop out of the denominator),
/// plus a flat list of every אונס with its day + reason. Missed days count
/// against the fraction (denominator includes days that weren't filled in).
async function buildWeeklyReport(student: ReportStudent, weekStart: string, now: Date) {
  const opts = resolveOptsFor(student);
  const dayKeys = weekDayKeys(weekStart);

  const entries = await db.dayEntry.findMany({
    where: { userId: student.id, dateKey: { in: dayKeys } },
    include: {
      checks: {
        orderBy: { order: "asc" },
        select: { itemLabel: true, checked: true, ones: true, onesReason: true },
      },
    },
  });
  const entryByKey = new Map(entries.map((e) => [e.dateKey, e]));

  const assignments = await db.dayTypeAssignment.findMany({
    where: { userId: student.id },
    select: { dayType: true, templateId: true },
  });
  const assignMap = new Map(assignments.map((a) => [a.dayType, a.templateId]));

  const templateIds = [...new Set(assignments.map((a) => a.templateId))];
  const templates = await db.checklistTemplate.findMany({
    where: { id: { in: templateIds } },
    include: { items: { where: { isArchived: false }, orderBy: { order: "asc" } } },
  });
  const templateById = new Map(templates.map((t) => [t.id, t]));

  type Bucket = {
    name: string;
    occurrences: number;
    filled: number;
    order: string[]; // item labels in display order
    items: Map<string, ReportItem>;
  };
  const buckets = new Map<string, Bucket>();
  const ones: ReportOnes[] = [];

  const ensureItem = (b: Bucket, label: string) => {
    let it = b.items.get(label);
    if (!it) {
      it = { label, done: 0, denom: 0, excused: 0 };
      b.items.set(label, it);
      b.order.push(label);
    }
    return it;
  };

  for (const dateKey of dayKeys) {
    const resolution = resolveDayType(dateKey, opts);
    const window = computeDayWindow(dateKey, resolution.isAssurMelacha, student, now);
    if (window.state === "FUTURE") continue; // day hasn't happened yet

    const entry = entryByKey.get(dateKey);

    // Which checklist ran this day.
    let key: string;
    let name: string;
    if (entry?.eventName) {
      key = `event:${dateKey}`;
      name = entry.eventName;
    } else {
      let templateId: string | undefined;
      for (const dt of resolution.checklistCandidates) {
        const tid = assignMap.get(dt);
        if (tid) {
          templateId = tid;
          break;
        }
      }
      if (!templateId) continue; // no checklist assigned → this day didn't "run"
      key = templateId;
      name = templateById.get(templateId)?.name ?? DAY_TYPE_LABELS[resolution.dayType];
    }

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { name, occurrences: 0, filled: 0, order: [], items: new Map() };
      buckets.set(key, bucket);
      // Seed the item list from the template so items show even on days the
      // checklist wasn't filled in.
      if (!entry?.eventName) {
        const t = templateById.get(key);
        for (const it of t?.items ?? []) ensureItem(bucket, it.label);
      }
    }
    bucket.occurrences++;
    if (entry?.status === "SUBMITTED") bucket.filled++;

    // Fold in any labels present on this day that we haven't seen yet.
    if (entry) for (const c of entry.checks) ensureItem(bucket, c.itemLabel);

    const checkByLabel = new Map(entry?.checks.map((c) => [c.itemLabel, c]) ?? []);
    for (const label of bucket.order) {
      const stat = bucket.items.get(label)!;
      const c = checkByLabel.get(label);
      if (c?.ones) {
        stat.excused++; // excused: drops out of the denominator
        ones.push({ date: dateKey, item: label, reason: c.onesReason });
      } else {
        stat.denom++;
        if (c?.checked) stat.done++;
      }
    }
  }

  const checklists: ReportChecklist[] = [...buckets.values()].map((b) => ({
    name: b.name,
    occurrences: b.occurrences,
    filled: b.filled,
    items: b.order.map((l) => b.items.get(l)!),
  }));

  const daysRan = checklists.reduce((n, c) => n + c.occurrences, 0);
  const daysFilled = checklists.reduce((n, c) => n + c.filled, 0);

  // Order the אונס list by date.
  ones.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const onesFormatted = ones.map((o) => ({
    ...o,
    date: DateTime.fromISO(o.date).toFormat("ccc LLL d"),
  }));

  return { daysRan, daysFilled, checklists, ones: onesFormatted };
}

/// Generates + emails any not-yet-sent weekly reports for the most recently
/// completed week, to each student's own email (they forward it to their
/// rebbe). Idempotent (WeeklyReport is unique per student + week).
export async function generateAndSendWeeklyReports(
  now: Date = new Date(),
): Promise<{ sent: number; skipped: number }> {
  const students = await db.user.findMany();

  let sent = 0;
  let skipped = 0;

  for (const student of students) {
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

    const data = await buildWeeklyReport(student, completedWeekStart, now);

    await db.weeklyReport.create({
      data: {
        studentId: student.id,
        weekStartKey: completedWeekStart,
        weekEndKey: weekEndKey(completedWeekStart),
        daysTracked: data.daysFilled,
        payload: JSON.stringify(data),
        sentAt: new Date(),
      },
    });

    const email: WeeklyReportEmail = {
      studentName: student.name ?? "",
      weekRange: formatWeekRange(completedWeekStart),
      daysRan: data.daysRan,
      daysFilled: data.daysFilled,
      checklists: data.checklists,
      ones: data.ones,
    };

    // Always send to the student; also send to each added rebbe recipient.
    const recipients = await db.reportRecipient.findMany({
      where: { userId: student.id },
      select: { email: true },
    });
    const seen = new Set<string>();
    const addresses = [student.email, ...recipients.map((r) => r.email)].filter(
      (addr) => {
        const key = addr.trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      },
    );
    for (const addr of addresses) await sendWeeklyReport(addr, email);
    sent++;
  }

  return { sent, skipped };
}
