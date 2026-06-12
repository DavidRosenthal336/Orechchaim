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
