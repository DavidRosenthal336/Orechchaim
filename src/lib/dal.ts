import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { decrypt, SESSION_COOKIE, type SessionPayload } from "@/lib/session";
import type { Role } from "@/lib/constants";

/// Reads + verifies the session cookie. Memoized per render pass.
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  return decrypt(cookie);
});

/// Throws (redirects) if there is no valid session. Use to gate protected
/// pages and server actions — this is the real authorization boundary, not
/// the optimistic check in proxy.ts.
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return session;
});

/// Loads the current user record, or null if the session is invalid / the
/// user no longer exists. Memoized per render pass.
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.userId) return null;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  return user;
});

/// Like getCurrentUser but redirects to /login when unauthenticated.
export const requireUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});

/// Requires a user with a specific role; redirects elsewhere otherwise.
export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) {
    redirect(user.role === "REBBE" ? "/rebbe" : "/today");
  }
  return user;
}
