"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createMagicToken, normalizeEmail } from "@/lib/auth";
import { sendMagicLink } from "@/lib/email";
import { deleteSession } from "@/lib/session";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

export type RequestLinkState = {
  ok?: boolean;
  error?: string;
  sentTo?: string;
};

export async function requestMagicLink(
  _prev: RequestLinkState,
  formData: FormData,
): Promise<RequestLinkState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const email = normalizeEmail(parsed.data.email);
  const token = await createMagicToken(email);
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const url = `${base}/api/auth/verify?token=${token}`;

  await sendMagicLink(email, url);
  return { ok: true, sentTo: email };
}

export async function signOut(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
