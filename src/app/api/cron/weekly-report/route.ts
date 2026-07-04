import { NextResponse, type NextRequest } from "next/server";
import { authorizeCron } from "@/lib/cron";
import {
  generateAndSendWeeklyReports,
  generateAndSendMonthlyReports,
} from "@/lib/reports";

export const dynamic = "force-dynamic";

// Runs daily. The weekly generator fires once at the start of each new week;
// the monthly generator fires once on Rosh Chodesh (the 1st of a Hebrew
// month) — both are idempotent and no-op otherwise.
export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const weekly = await generateAndSendWeeklyReports();
  const monthly = await generateAndSendMonthlyReports();
  return NextResponse.json({ ok: true, weekly, monthly });
}
