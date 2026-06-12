import "server-only";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/// Creates a single-use magic-link token for `email`, stores only its hash,
/// and returns the raw token to embed in the emailed URL.
export async function createMagicToken(email: string): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.magicToken.create({
    data: { email: normalizeEmail(email), tokenHash, expiresAt },
  });

  return rawToken;
}

/// Validates and consumes a raw token. Returns the associated email on
/// success, or null if the token is unknown, expired, or already used.
export async function consumeMagicToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const token = await db.magicToken.findUnique({ where: { tokenHash } });

  if (!token || token.usedAt || token.expiresAt < new Date()) {
    return null;
  }

  await db.magicToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  return token.email;
}

/// Finds or creates the user for a verified email. The first account on a
/// fresh install is the student (the app owner); roles are refined later in
/// settings / the rebbe-invite flow.
export async function findOrCreateUser(email: string) {
  const normalized = normalizeEmail(email);
  const existing = await db.user.findUnique({ where: { email: normalized } });
  if (existing) return existing;

  return db.user.create({
    data: { email: normalized, role: "STUDENT" },
  });
}
