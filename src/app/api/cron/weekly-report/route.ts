import { NextResponse, type NextRequest } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { generateAndSendWeeklyReports } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await generateAndSendWeeklyReports();
  return NextResponse.json({ ok: true, ...result });
}
