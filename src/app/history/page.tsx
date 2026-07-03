import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { todayKey } from "@/lib/calendar";
import { weekStartKey, formatWeekRange } from "@/lib/week";
import { getWeekBoard, getStudentHistory } from "@/lib/progress";
import { WeekBoard } from "@/components/week-board";
import { Card } from "@/components/ui";

export default async function HistoryPage() {
  const user = await requireUser();
  const weekStart = weekStartKey(todayKey(user.timezone));

  const [board, history] = await Promise.all([
    getWeekBoard(user, weekStart),
    getStudentHistory(user, 8),
  ]);
  const pastWeeks = history.slice(1); // drop the current week

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <header className="flex items-center gap-2 py-5">
        <Link
          href="/today"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-2"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Past weeks</h1>
      </header>

      <main className="flex-1 space-y-7 pb-10">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">
            This week · {formatWeekRange(weekStart)}
          </h2>
          <WeekBoard days={board} />
        </section>

        {pastWeeks.length > 0 ? (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted">Earlier</h2>
            <div className="space-y-2">
              {pastWeeks.map((w) => (
                <Link key={w.weekStart} href={`/history/${w.weekStart}`}>
                  <Card className="flex items-center justify-between gap-3 transition-colors hover:bg-surface-2">
                    <div>
                      <p className="text-sm font-medium">
                        {formatWeekRange(w.weekStart)}
                      </p>
                      <p className="text-xs text-muted">
                        {w.daysTracked === 0
                          ? "Nothing filled in"
                          : `${w.daysTracked} ${w.daysTracked === 1 ? "day" : "days"} filled in`}
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
