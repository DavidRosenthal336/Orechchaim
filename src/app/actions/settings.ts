"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  timezone: z.string().trim().min(1),
  inIsrael: z.boolean(),
  beinHazmanimMode: z.boolean(),
  rebbeName: z.string().trim().max(80).optional(),
  rebbeEmail: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "Enter a valid rebbe email (or leave it blank).",
    }),
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
    beinHazmanimMode: formData.get("beinHazmanimMode") === "on",
    rebbeName: formData.get("rebbeName") ?? undefined,
    rebbeEmail: formData.get("rebbeEmail") ?? undefined,
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
      beinHazmanimMode: data.beinHazmanimMode,
      rebbeName: data.rebbeName?.length ? data.rebbeName : null,
      rebbeEmail: data.rebbeEmail?.length ? data.rebbeEmail.toLowerCase() : null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/today");
  return { ok: true };
}
