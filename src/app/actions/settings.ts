"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  timezone: z.string().trim().min(1),
  inIsrael: z.boolean(),
  reminderOptIn: z.boolean(),
  reminderHour: z.coerce.number().int().min(0).max(23),
  beinHazmanimMode: z.boolean(),
});

export type SettingsState = { ok?: boolean; error?: string };

export async function updateSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();

  const parsed = schema.safeParse({
    name: formData.get("name") ?? undefined,
    timezone: formData.get("timezone"),
    inIsrael: formData.get("inIsrael") === "on",
    reminderOptIn: formData.get("reminderOptIn") === "on",
    reminderHour: formData.get("reminderHour"),
    beinHazmanimMode: formData.get("beinHazmanimMode") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid settings." };
  }

  const data = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: {
      name: data.name?.length ? data.name : null,
      timezone: data.timezone,
      inIsrael: data.inIsrael,
      reminderOptIn: data.reminderOptIn,
      reminderHour: data.reminderHour,
      beinHazmanimMode: data.beinHazmanimMode,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/today");
  return { ok: true };
}
