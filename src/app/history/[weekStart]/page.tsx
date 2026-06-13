import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { weekStartKey, formatWeekRange } from "@/lib/week";
import { getWeekBoard } from "@/lib/progress";
import { WeekBoard } from "@/components/week-board";

export default async function HistoryWeekPage({
  params,
}: {
  params: Promise<{ weekStart: string }>;
}) {
  const { weekStart } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) redirect("/history");

  const user = await requireUser();
  const normalized = weekStartKey(weekStart);
  const board = await getWeekBoard(user, normalized);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <header className="flex items-center gap-2 py-5">
        <Link
          href="/history"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-2"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">
          {formatWeekRange(normalized)}
        </h1>
      </header>

      <main className="flex-1 pb-10">
        <WeekBoard days={board} />
      </main>
    </div>
  );
}
