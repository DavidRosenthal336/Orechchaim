"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { recomputeEntry } from "@/lib/day";
import { resolveDayType } from "@/lib/calendar";
import { computeDayWindow, resolveOptsFor, type DayUserSettings } from "@/lib/dayWindow";

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
    // Checking an item clears any אונס on it (flag and reason).
    data: checked
      ? { checked: true, ones: false, onesReason: null }
      : { checked: false },
  });
  await recomputeEntry(dayEntryId);
  revalidateDay(entry.dateKey);
}

/// Marks a single item as אונס (excused) or clears it. Marking requires a
/// non-empty reason; clearing does not. Excused items don't count against the
/// day. Called optimistically from the client.
export async function setItemOnes(
  dayEntryId: string,
  itemCheckId: string,
  ones: boolean,
  reason?: string,
): Promise<void> {
  const { user, entry } = await loadOwned(dayEntryId);
  if (entry.status === "SUBMITTED" || !isWindowOpen(user, entry.dateKey)) return;

  const trimmed = (reason ?? "").trim().slice(0, 300);
  // A reason is mandatory to mark אונס — bail if it's missing.
  if (ones && trimmed.length === 0) return;

  await db.itemCheck.updateMany({
    where: { id: itemCheckId, dayEntryId },
    data: ones
      ? { ones: true, checked: false, onesReason: trimmed }
      : { ones: false, onesReason: null },
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
