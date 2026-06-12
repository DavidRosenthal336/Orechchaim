"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/dal";
import { recomputeEntry } from "@/lib/day";

/// Rebbe accepts or denies a pending אונס. Accepting flips a short day to a
/// good day (via recompute).
export async function decideOnes(formData: FormData): Promise<void> {
  const rebbe = await requireRole("REBBE");
  const dayEntryId = String(formData.get("dayEntryId"));
  const decision = String(formData.get("decision")); // "accept" | "deny"
  if (decision !== "accept" && decision !== "deny") return;

  const entry = await db.dayEntry.findUnique({
    where: { id: dayEntryId },
    include: { user: { select: { rebbeId: true } } },
  });
  if (!entry || entry.user.rebbeId !== rebbe.id) redirect("/rebbe");
  if (entry.onesStatus !== "PENDING") return;

  await db.dayEntry.update({
    where: { id: entry.id },
    data: {
      onesStatus: decision === "accept" ? "ACCEPTED" : "DENIED",
      onesDecidedById: rebbe.id,
      onesDecidedAt: new Date(),
    },
  });
  await recomputeEntry(entry.id);

  revalidatePath("/rebbe");
}
