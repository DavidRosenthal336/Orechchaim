import "server-only";
import { Resend } from "resend";
import nodemailer from "nodemailer";

const from = process.env.EMAIL_FROM ?? "Orech Chaim <onboarding@resend.dev>";

// Sending backends, in order of preference:
// 1. Gmail / SMTP  — set SMTP_USER + SMTP_PASS (a Gmail "app password").
// 2. Resend        — set RESEND_API_KEY.
// 3. Dev console    — neither set: emails are logged, so dev needs no account.
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT ?? "465");

const transporter =
  smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      })
    : null;

const resendKey = process.env.RESEND_API_KEY;
const resend = !transporter && resendKey ? new Resend(resendKey) : null;

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/// Sends an email via Gmail/SMTP if configured, else Resend, else logs to the
/// server console (so dev works without any email account).
export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  if (transporter) {
    await transporter.sendMail({ from, to, subject, html, text });
    return;
  }

  if (resend) {
    const { error } = await resend.emails.send({ from, to, subject, html, text });
    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
    return;
  }

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
}

export type WeeklyReportEmail = {
  studentName: string;
  weekRange: string;
  daysTracked: number;
  lines: string[]; // per-day "Mon Jun 9 — 5 of 8 done" style lines
};

export async function sendWeeklyReport(
  to: string,
  data: WeeklyReportEmail,
): Promise<void> {
  const subject = `Your Orech Chaim report — ${data.weekRange}`;
  const daysLabel = `${data.daysTracked} ${data.daysTracked === 1 ? "day" : "days"} filled in`;
  const text = [
    `Your week — ${data.weekRange}. Forward this to your rebbe.`,
    "",
    daysLabel,
    "",
    ...data.lines,
  ].join("\n");

  const rows = data.lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #eef2f9;font-size:14px">${l}</td></tr>`,
    )
    .join("");

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#243044">
    <h1 style="font-size:20px;margin:0 0 4px">Your week</h1>
    <p style="margin:0 0 16px;color:#5b6b82;font-size:14px">${data.weekRange} · forward to your rebbe</p>
    <div style="background:#e7eefb;border-radius:12px;padding:16px;margin:0 0 16px">
      <p style="margin:0;font-size:18px;font-weight:700">${daysLabel}</p>
      <p style="margin:2px 0 0;color:#5b6b82;font-size:13px">a record of what you did &amp; didn't get to</p>
    </div>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
  </div>`;

  await sendEmail({ to, subject, html, text });
}

export async function sendMagicLink(to: string, url: string): Promise<void> {
  const subject = "Your Orech Chaim sign-in link";
  const text = [
    "Click the link below to sign in to Orech Chaim:",
    "",
    url,
    "",
    "This link expires in 15 minutes and can be used once.",
    "If you didn't request this, you can ignore this email.",
  ].join("\n");

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#243044">
    <h1 style="font-size:20px;margin:0 0 16px">Sign in to Orech Chaim</h1>
    <p style="margin:0 0 24px;line-height:1.5">Click the button below to sign in. This link expires in 15 minutes and can be used once.</p>
    <p style="margin:0 0 24px">
      <a href="${url}" style="display:inline-block;background:#3B6FB0;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Sign in</a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5">If the button doesn't work, paste this link into your browser:<br>${url}</p>
  </div>`;

  await sendEmail({ to, subject, html, text });
}
