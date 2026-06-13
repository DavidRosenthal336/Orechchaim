/// The app's public base URL, used to build magic-link / email URLs.
/// Prefers an explicit APP_URL; on Vercel, falls back to the production domain
/// (or the per-deployment URL) so links work even before APP_URL is set.
export function getAppUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
