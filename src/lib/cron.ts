import "server-only";

/// Authorizes a cron request. CRON_SECRET is optional: if it's set, requests
/// must match it via the `Authorization: Bearer <secret>` header (sent by
/// Vercel Cron) or a `?key=<secret>` query param. If it isn't set, the endpoint
/// is open — fine here because the only job (the weekly report) is idempotent
/// and only emails each user their own report.
export function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const key = new URL(req.url).searchParams.get("key");
  return key === secret;
}
