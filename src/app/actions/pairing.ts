"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { createMagicToken, normalizeEmail } from "@/lib/auth";
import { sendRebbeInvite } from "@/lib/email";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export type InviteState = { ok?: boolean; error?: string; sentTo?: string };

export async function inviteRebbe(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const student = await requireUser();
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const email = normalizeEmail(parsed.data.email);
  if (email === student.email) {
    return { error: "That's your own email — enter your rebbe's address." };
  }

  // Find or create the rebbe user, marking them as a REBBE.
  const rebbe = await db.user.upsert({
    where: { email },
    update: { role: "REBBE" },
    create: { email, role: "REBBE" },
  });

  await db.user.update({
    where: { id: student.id },
    data: { rebbeId: rebbe.id },
  });

  // Email them a sign-in link.
  const token = await createMagicToken(email);
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const url = `${base}/api/auth/verify?token=${token}`;
  await sendRebbeInvite(email, student.name ?? "Your talmid", url);

  revalidatePath("/settings");
  return { ok: true, sentTo: email };
}

export async function removeRebbe(): Promise<void> {
  const student = await requireUser();
  await db.user.update({
    where: { id: student.id },
    data: { rebbeId: null },
  });
  revalidatePath("/settings");
}
