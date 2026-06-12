# Deploying Orechchaim

This guide takes the app from local SQLite development to a live deployment on
**Vercel + Neon Postgres + Resend**, all of which have free tiers.

Local development uses SQLite and prints emails to the server console, so you
need none of these accounts to build and try the app. You only need them to put
it online for you and your rebbe.

---

## 1. Create the accounts (all free)

1. **Neon** (Postgres database) — <https://neon.tech>. Create a project and copy
   the **connection string** (looks like `postgresql://user:pass@host/db?sslmode=require`).
2. **Resend** (email) — <https://resend.com>. Create an API key. To send from your
   own domain, verify it; otherwise you can send from `onboarding@resend.dev`
   while testing.
3. **Vercel** (hosting) — <https://vercel.com>. You'll import this Git repo.

---

## 2. Switch the database to Postgres

In `prisma/schema.prisma`, change the datasource provider:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Then, with `DATABASE_URL` pointing at Neon, create the schema:

```bash
DATABASE_URL="postgresql://…neon…" npx prisma db push
```

(The schema uses only portable column types, so nothing else changes.)

---

## 3. Environment variables (set these on Vercel)

| Variable         | Value                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`   | Your Neon connection string                                           |
| `SESSION_SECRET` | A long random string — `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `APP_URL`        | Your deployed URL, e.g. `https://orechchaim.vercel.app`               |
| `RESEND_API_KEY` | From Resend                                                           |
| `EMAIL_FROM`     | e.g. `Orechchaim <onboarding@resend.dev>` or your verified domain     |
| `CRON_SECRET`    | A random string (protects the cron endpoints)                         |

---

## 4. Deploy

1. Push this branch to GitHub (already done).
2. In Vercel, **Import** the repo. Framework auto-detects as Next.js.
3. Add the environment variables above.
4. Deploy. `prisma generate` runs automatically via the `postinstall` script.

---

## 5. Scheduled jobs (reports + reminders)

`vercel.json` defines two cron jobs:

- `/api/cron/weekly-report` — daily at 11:00 UTC. Sends each rebbe the report for
  the most recently completed week (Sunday → Shabbos). Idempotent: one email per
  week.
- `/api/cron/reminder` — hourly. Emails opted-in students at their chosen hour if
  they haven't filled in today.

**Vercel Hobby (free) plan note:** Hobby crons run at most once per day, so the
**weekly report works out of the box**, but the **hourly reminder will only fire
once a day**. Two options for true hourly reminders:

- Upgrade to Vercel Pro, **or**
- Use a free external scheduler (e.g. <https://cron-job.org> or a GitHub Action)
  to hit `https://YOUR_APP/api/cron/reminder?key=YOUR_CRON_SECRET` every hour.

Both endpoints require auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`
automatically; external callers pass `?key=$CRON_SECRET`.

---

## 6. First-run setup

1. Open your deployed URL and sign in with your email (check your inbox for the
   magic link).
2. Go to **Settings**, set your timezone, and under **Your rebbe** add your
   rebbe's email — he'll get a sign-in link.
3. Build your checklists and assign them to day-types.

---

## Notes / future refinements

- **Motzei unlock time** is currently a conservative fixed local time (8:30 PM)
  for Shabbos/Yom Tov checklists. It can be made precise with real *zmanim* once
  a latitude/longitude is collected in Settings (the schema already has fields
  for it).
- **Push notifications** (vs. email reminders) are a planned follow-up; the app
  is already installable as a PWA, which is the prerequisite.
