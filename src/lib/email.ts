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

export type WeeklyReportItem = {
  label: string;
  done: number;
  denom: number;
  excused: number;
};
export type WeeklyReportChecklist = {
  name: string;
  occurrences: number;
  filled: number;
  items: WeeklyReportItem[];
};
export type WeeklyReportOnes = {
  date: string;
  item: string;
  reason: string | null;
};
export type WeeklyReportEmail = {
  studentName: string;
  weekRange: string;
  daysRan: number;
  daysFilled: number;
  checklists: WeeklyReportChecklist[];
  ones: WeeklyReportOnes[];
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/// "4/5", "3/4 *" (with an אונס), or "— all excused".
function fractionText(it: WeeklyReportItem): string {
  if (it.denom === 0) return "— all excused";
  return `${it.done}/${it.denom}${it.excused > 0 ? " *" : ""}`;
}

export async function sendWeeklyReport(
  to: string,
  data: WeeklyReportEmail,
): Promise<void> {
  const subject = `Your Orech Chaim report — ${data.weekRange}`;
  const daysLabel = `Filled in ${data.daysFilled} of ${data.daysRan} day${
    data.daysRan === 1 ? "" : "s"
  }`;
  const anyExcused = data.checklists.some((c) =>
    c.items.some((it) => it.excused > 0),
  );

  // ---- plain text ----
  const textParts: string[] = [
    `Your week — ${data.weekRange}. Forward this to your rebbe.`,
    "",
    daysLabel,
  ];
  for (const c of data.checklists) {
    textParts.push(
      "",
      `${c.name} — ${c.occurrences} day${c.occurrences === 1 ? "" : "s"} (filled ${c.filled})`,
    );
    for (const it of c.items) textParts.push(`  ${it.label}  ${fractionText(it)}`);
  }
  if (data.ones.length > 0) {
    textParts.push("", `אונס this week (${data.ones.length}):`);
    for (const o of data.ones)
      textParts.push(`  ${o.date} · ${o.item}${o.reason ? ` — ${o.reason}` : ""}`);
  }
  if (anyExcused)
    textParts.push("", "* an אונס that week — excused, so it's left out of the count.");
  const text = textParts.join("\n");

  // ---- html ----
  const cards = data.checklists
    .map((c) => {
      const rows = c.items
        .map((it) => {
          const star = it.excused > 0 ? ` <span style="color:#b7791f">*</span>` : "";
          const frac =
            it.denom === 0 ? "— all excused" : `${it.done}/${it.denom}${star}`;
          return `<tr>
            <td style="padding:5px 0;font-size:14px;border-top:1px solid #eef2f9">${esc(it.label)}</td>
            <td style="padding:5px 0;font-size:14px;font-weight:600;text-align:right;white-space:nowrap;border-top:1px solid #eef2f9">${frac}</td>
          </tr>`;
        })
        .join("");
      const missed = c.occurrences - c.filled;
      const sub =
        `${c.occurrences} day${c.occurrences === 1 ? "" : "s"}` +
        (missed > 0 ? ` · ${missed} not filled in` : "");
      return `<div style="border:1px solid #e6ebf3;border-radius:12px;padding:14px 16px;margin:0 0 12px">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700">${esc(c.name)}</p>
        <p style="margin:0 0 6px;color:#5b6b82;font-size:12px">${sub}</p>
        <table style="width:100%;border-collapse:collapse">${rows}</table>
      </div>`;
    })
    .join("");

  const onesHtml =
    data.ones.length > 0
      ? `<div style="border:1px solid #f0e2c8;background:#fbf6ea;border-radius:12px;padding:14px 16px;margin:0 0 12px">
          <p style="margin:0 0 8px;font-size:15px;font-weight:700">אונס this week (${data.ones.length})</p>
          <table style="width:100%;border-collapse:collapse">
          ${data.ones
            .map(
              (o) =>
                `<tr><td style="padding:4px 0;font-size:13px;color:#4a5568;vertical-align:top;white-space:nowrap">${esc(
                  o.date,
                )}</td><td style="padding:4px 0 4px 10px;font-size:13px;color:#243044">${esc(
                  o.item,
                )}${o.reason ? ` — <span style="color:#5b6b82">${esc(o.reason)}</span>` : ""}</td></tr>`,
            )
            .join("")}
          </table>
        </div>`
      : "";

  const footnote = anyExcused
    ? `<p style="margin:4px 0 0;color:#8a97a8;font-size:11px">* an אונס that week — excused, so it's left out of the count.</p>`
    : "";

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#243044">
    <h1 style="font-size:20px;margin:0 0 4px">Your week</h1>
    <p style="margin:0 0 14px;color:#5b6b82;font-size:14px">${data.weekRange} · forward to your rebbe</p>
    <div style="background:#e7eefb;border-radius:12px;padding:12px 16px;margin:0 0 16px">
      <p style="margin:0;font-size:16px;font-weight:700">${daysLabel}</p>
    </div>
    ${cards}
    ${onesHtml}
    ${footnote}
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
