import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { weekStartKey, formatWeekRange } from "@/lib/week";
import { getTalmidim, getWeekBoard } from "@/lib/rebbe";
import { WeekBoard } from "@/components/week-board";
import { Card } from "@/components/ui";

export default async function RebbeWeekPage({
  params,
}: {
  params: Promise<{ weekStart: string }>;
}) {
  const { weekStart } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) redirect("/rebbe");

  const user = await requireUser();
  if (user.role !== "REBBE") redirect("/today");

  const talmidim = await getTalmidim(user.id);
  if (talmidim.length === 0) redirect("/rebbe");
  const student = talmidim[0];

  // Normalize to the actual Sunday of that week.
  const normalized = weekStartKey(weekStart);
  const board = await getWeekBoard(student, normalized);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <header className="flex items-center gap-2 py-5">
        <Link
          href="/rebbe"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-2"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">
          {formatWeekRange(normalized)}
        </h1>
      </header>

      <main className="flex-1 space-y-4 py-2 pb-10">
        <p className="text-sm text-muted">
          {student.name ?? student.email}
        </p>
        <WeekBoard days={board} />
        <Card className="text-xs leading-relaxed text-muted">
          Accepted <span className="heb">אונס</span> days show as a good day.
          Denied ones remain short.
        </Card>
      </main>
    </div>
  );
}
