import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { todayKey } from "@/lib/calendar";
import { weekStartKey, formatWeekRange } from "@/lib/week";
import {
  getTalmidim,
  getWeekBoard,
  getPendingOnes,
  getStudentHistory,
} from "@/lib/rebbe";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui";
import { WeekBoard } from "@/components/week-board";
import { PendingOnes } from "@/components/pending-ones";

export default async function RebbePage() {
  const user = await requireUser();
  if (user.role !== "REBBE") redirect("/today");

  const talmidim = await getTalmidim(user.id);

  if (talmidim.length === 0) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
        <AppHeader home="/rebbe" />
        <main className="flex flex-1 items-center py-4">
          <Card className="text-center text-sm leading-relaxed text-muted">
            No talmid is linked to you yet. Ask your talmid to add your email
            under <span className="font-medium text-foreground">Settings → Your rebbe</span>.
          </Card>
        </main>
      </div>
    );
  }

  const student = talmidim[0];
  const studentName = student.name ?? student.email;
  const weekStart = weekStartKey(todayKey(student.timezone));

  const [board, pending, history] = await Promise.all([
    getWeekBoard(student, weekStart),
    getPendingOnes(student.id),
    getStudentHistory(student, 8),
  ]);
  const pastWeeks = history.slice(1); // drop the current week

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <AppHeader home="/rebbe" />
      <main className="flex-1 space-y-7 py-2 pb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{studentName}</h1>
          {talmidim.length > 1 ? (
            <p className="mt-0.5 text-xs text-muted">
              +{talmidim.length - 1} more talmid
              {talmidim.length - 1 === 1 ? "" : "im"}
            </p>
          ) : null}
        </div>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">
            This week · {formatWeekRange(weekStart)}
          </h2>
          <WeekBoard days={board} />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">
            <span className="heb">אונס</span> requests
          </h2>
          <PendingOnes items={pending} />
        </section>

        {pastWeeks.length > 0 ? (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted">Past weeks</h2>
            <div className="space-y-2">
              {pastWeeks.map((w) => (
                <Link key={w.weekStart} href={`/rebbe/${w.weekStart}`}>
                  <Card className="flex items-center justify-between gap-3 transition-colors hover:bg-surface-2">
                    <div>
                      <p className="text-sm font-medium">
                        {formatWeekRange(w.weekStart)}
                      </p>
                      <p className="text-xs text-muted">
                        {w.daysMet}/{w.daysTracked} good days
                        {w.onesPending > 0
                          ? ` · ${w.onesPending} אונס pending`
                          : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted" />
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
