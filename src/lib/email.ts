import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Orechchaim <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/// Sends an email via Resend. In dev (no RESEND_API_KEY) it logs to the
/// server console instead, so the whole app is usable without an email
/// account.
export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  if (!resend) {
    console.log(
      [
        "",
        "📧 ─────────── EMAIL (dev console) ───────────",
        `To:      ${to}`,
        `Subject: ${subject}`,
        "",
        text,
        "─────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return;
  }

  const { error } = await resend.emails.send({ from, to, subject, html, text });
  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export type WeeklyReportEmail = {
  studentName: string;
  weekRange: string;
  daysMet: number;
  daysTracked: number;
  onesAccepted: number;
  onesPending: number;
  lines: string[]; // per-day "Mon Jun 9 — Good" style lines
  dashboardUrl: string;
};

export async function sendWeeklyReport(
  to: string,
  data: WeeklyReportEmail,
): Promise<void> {
  const subject = `${data.studentName}: ${data.daysMet}/${data.daysTracked} good days (${data.weekRange})`;
  const text = [
    `Weekly report for ${data.studentName} — ${data.weekRange}`,
    "",
    `Good days: ${data.daysMet} of ${data.daysTracked} tracked`,
    data.onesAccepted ? `אונס accepted: ${data.onesAccepted}` : "",
    data.onesPending ? `אונס awaiting you: ${data.onesPending}` : "",
    "",
    ...data.lines,
    "",
    `Open the dashboard: ${data.dashboardUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const rows = data.lines
    .map(
      (l) =>
        `<tr><td style="padding:4px 0;border-bottom:1px solid #eef2f9;font-size:14px">${l}</td></tr>`,
    )
    .join("");

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#243044">
    <h1 style="font-size:20px;margin:0 0 4px">${data.studentName}</h1>
    <p style="margin:0 0 16px;color:#5b6b82;font-size:14px">${data.weekRange}</p>
    <div style="background:#e7eefb;border-radius:12px;padding:16px;margin:0 0 16px">
      <p style="margin:0;font-size:24px;font-weight:700">${data.daysMet} / ${data.daysTracked}</p>
      <p style="margin:2px 0 0;color:#5b6b82;font-size:13px">good days tracked${data.onesPending ? ` · ${data.onesPending} אונס awaiting you` : ""}</p>
    </div>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
    <p style="margin:20px 0 0">
      <a href="${data.dashboardUrl}" style="display:inline-block;background:#3B6FB0;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;font-size:14px">Open dashboard</a>
    </p>
  </div>`;

  await sendEmail({ to, subject, html, text });
}

export async function sendReminder(
  to: string,
  name: string,
  url: string,
): Promise<void> {
  const subject = "Tonight's checklist";
  const greeting = name ? `${name}, ` : "";
  const text = [
    `${greeting}a quiet reminder to fill in today's checklist before you turn in.`,
    "",
    url,
  ].join("\n");
  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#243044">
    <p style="margin:0 0 20px;line-height:1.5">${greeting}a quiet reminder to fill in today's checklist before you turn in.</p>
    <p style="margin:0">
      <a href="${url}" style="display:inline-block;background:#3B6FB0;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;font-size:14px">Open today</a>
    </p>
  </div>`;
  await sendEmail({ to, subject, html, text });
}

export async function sendRebbeInvite(
  to: string,
  studentName: string,
  url: string,
): Promise<void> {
  const subject = `${studentName} added you as their rebbe on Orechchaim`;
  const text = [
    `${studentName} is using Orechchaim — a daily growth checklist — and added you as their rebbe.`,
    "",
    "You'll get a weekly report on how they're doing, and you can review and approve their אונס requests. Sign in here:",
    "",
    url,
    "",
    "This link expires in 15 minutes and can be used once.",
  ].join("\n");

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#243044">
    <h1 style="font-size:20px;margin:0 0 16px">You've been added as a rebbe</h1>
    <p style="margin:0 0 16px;line-height:1.5">${studentName} is using Orechchaim — a daily growth checklist — and added you as their rebbe. You'll get a weekly report and can review their <span dir="rtl">אונס</span> requests.</p>
    <p style="margin:0 0 24px">
      <a href="${url}" style="display:inline-block;background:#3B6FB0;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Sign in</a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5">Or paste this link into your browser:<br>${url}</p>
  </div>`;

  await sendEmail({ to, subject, html, text });
}

export async function sendMagicLink(to: string, url: string): Promise<void> {
  const subject = "Your Orechchaim sign-in link";
  const text = [
    "Click the link below to sign in to Orechchaim:",
    "",
    url,
    "",
    "This link expires in 15 minutes and can be used once.",
    "If you didn't request this, you can ignore this email.",
  ].join("\n");

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#243044">
    <h1 style="font-size:20px;margin:0 0 16px">Sign in to Orechchaim</h1>
    <p style="margin:0 0 24px;line-height:1.5">Click the button below to sign in. This link expires in 15 minutes and can be used once.</p>
    <p style="margin:0 0 24px">
      <a href="${url}" style="display:inline-block;background:#3B6FB0;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Sign in</a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5">If the button doesn't work, paste this link into your browser:<br>${url}</p>
  </div>`;

  await sendEmail({ to, subject, html, text });
}
