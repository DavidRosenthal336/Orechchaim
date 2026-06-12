"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { recomputeEntry } from "@/lib/day";
import { resolveDayType } from "@/lib/calendar";
import { computeDayWindow, resolveOptsFor, type DayUserSettings } from "@/lib/dayWindow";
import { isDayType } from "@/lib/constants";

function settings(user: {
  id: string;
  timezone: string;
  inIsrael: boolean;
  beinHazmanimMode: boolean;
  beinHazmanimTargetType: string;
}): DayUserSettings {
  return {
    id: user.id,
    timezone: user.timezone,
    inIsrael: user.inIsrael,
    beinHazmanimMode: user.beinHazmanimMode,
    beinHazmanimTargetType: user.beinHazmanimTargetType,
  };
}

/// Loads an entry owned by the current user, or redirects away.
async function loadOwned(dayEntryId: string) {
  const user = await requireUser();
  const entry = await db.dayEntry.findFirst({
    where: { id: dayEntryId, userId: user.id },
  });
  if (!entry) redirect("/today");
  return { user, entry };
}

function isWindowOpen(
  user: Parameters<typeof settings>[0],
  dateKey: string,
): boolean {
  const resolution = resolveDayType(dateKey, resolveOptsFor(settings(user)));
  const window = computeDayWindow(dateKey, resolution.isAssurMelacha, settings(user));
  return window.state === "OPEN";
}

function revalidateDay(dateKey: string) {
  revalidatePath("/today");
  revalidatePath(`/day/${dateKey}`);
}

/// Toggles a single checklist item. Called directly (optimistically) from the
/// client checklist.
export async function toggleItem(
  dayEntryId: string,
  itemCheckId: string,
  checked: boolean,
): Promise<void> {
  const { user, entry } = await loadOwned(dayEntryId);
  if (entry.status === "SUBMITTED" || !isWindowOpen(user, entry.dateKey)) return;

  await db.itemCheck.updateMany({
    where: { id: itemCheckId, dayEntryId },
    data: { checked: Boolean(checked) },
  });
  await recomputeEntry(dayEntryId);
  revalidateDay(entry.dateKey);
}

export async function submitDay(formData: FormData): Promise<void> {
  const { user, entry } = await loadOwned(String(formData.get("dayEntryId")));
  if (!isWindowOpen(user, entry.dateKey)) return;

  await db.dayEntry.update({
    where: { id: entry.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
  await recomputeEntry(entry.id);
  revalidateDay(entry.dateKey);
}

export async function reopenDay(formData: FormData): Promise<void> {
  const { user, entry } = await loadOwned(String(formData.get("dayEntryId")));
  if (!isWindowOpen(user, entry.dateKey)) return;

  await db.dayEntry.update({
    where: { id: entry.id },
    data: { status: "OPEN", submittedAt: null },
  });
  revalidateDay(entry.dateKey);
}

const reasonSchema = z
  .string()
  .trim()
  .min(3, "Please give a short reason.")
  .max(500);

export type OnesState = { error?: string };

export async function requestOnes(
  _prev: OnesState,
  formData: FormData,
): Promise<OnesState> {
  const { user, entry } = await loadOwned(String(formData.get("dayEntryId")));
  if (!isWindowOpen(user, entry.dateKey)) return {};

  const reason = reasonSchema.safeParse(formData.get("reason"));
  if (!reason.success) {
    return { error: reason.error.issues[0]?.message ?? "Invalid reason." };
  }

  await db.dayEntry.update({
    where: { id: entry.id },
    data: {
      onesRequested: true,
      onesReason: reason.data,
      onesStatus: "PENDING",
      onesDecidedById: null,
      onesDecidedAt: null,
    },
  });
  await recomputeEntry(entry.id);
  revalidateDay(entry.dateKey);
  return {};
}

export async function cancelOnes(formData: FormData): Promise<void> {
  const { user, entry } = await loadOwned(String(formData.get("dayEntryId")));
  if (!isWindowOpen(user, entry.dateKey)) return;
  if (entry.onesStatus !== "PENDING") return; // can't retract once decided

  await db.dayEntry.update({
    where: { id: entry.id },
    data: {
      onesRequested: false,
      onesReason: null,
      onesStatus: null,
    },
  });
  await recomputeEntry(entry.id);
  revalidateDay(entry.dateKey);
}

/// Manual override of which checklist applies to a day (tucked-away control).
/// Re-snapshots the items from the chosen day-type's checklist.
export async function setDayOverride(formData: FormData): Promise<void> {
  const { user, entry } = await loadOwned(String(formData.get("dayEntryId")));
  if (!isWindowOpen(user, entry.dateKey)) return;

  const dayType = String(formData.get("dayType"));
  if (!isDayType(dayType)) return;

  const assignment = await db.dayTypeAssignment.findUnique({
    where: { userId_dayType: { userId: user.id, dayType } },
  });
  const template = assignment
    ? await db.checklistTemplate.findFirst({
        where: { id: assignment.templateId, isArchived: false },
        include: {
          items: { where: { isArchived: false }, orderBy: { order: "asc" } },
        },
      })
    : null;
  if (!template) return; // no checklist for that day-type — ignore

  await db.$transaction(async (tx) => {
    await tx.itemCheck.deleteMany({ where: { dayEntryId: entry.id } });
    await tx.dayEntry.update({
      where: { id: entry.id },
      data: {
        overriddenDayType: dayType,
        dayType,
        templateId: template.id,
        targetCount: template.targetCount,
        completedCount: 0,
        met: false,
        status: "OPEN",
        submittedAt: null,
        checks: {
          create: template.items.map((it, i) => ({
            itemId: it.id,
            itemLabel: it.label,
            order: i,
          })),
        },
      },
    });
  });
  revalidateDay(entry.dateKey);
}
