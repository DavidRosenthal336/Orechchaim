import "server-only";

/// Authorizes a cron request. In production a CRON_SECRET must match either the
/// `Authorization: Bearer <secret>` header (sent automatically by Vercel Cron)
/// or a `?key=<secret>` query param (for external schedulers / manual runs).
/// In development, when no secret is set, requests are allowed.
export function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const key = new URL(req.url).searchParams.get("key");
  return key === secret;
}
