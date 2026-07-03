"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";

export type RecipientState = { ok?: boolean; error?: string };

const emailSchema = z.string().trim().email("Enter a valid email address.");
const nameSchema = z.string().trim().max(80).optional();

/// Adds a rebbe the weekly report is emailed to (up to a sane cap).
export async function addRecipient(
  _prev: RecipientState,
  formData: FormData,
): Promise<RecipientState> {
  const user = await requireUser();

  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return { error: email.error.issues[0]?.message ?? "Invalid email." };
  }
  const name = nameSchema.safeParse(formData.get("name") ?? undefined);
  const nameValue = name.success && name.data?.length ? name.data : null;

  const count = await db.reportRecipient.count({ where: { userId: user.id } });
  if (count >= 10) {
    return { error: "That's the maximum number of recipients." };
  }

  // Skip duplicates (case-insensitive).
  const existing = await db.reportRecipient.findFirst({
    where: { userId: user.id, email: { equals: email.data, mode: "insensitive" } },
  });
  if (existing) {
    return { error: "That email is already on the list." };
  }

  await db.reportRecipient.create({
    data: { userId: user.id, email: email.data, name: nameValue },
  });
  revalidatePath("/settings");
  return { ok: true };
}

/// Removes a rebbe from the report recipients.
export async function removeRecipient(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await db.reportRecipient.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/settings");
}
