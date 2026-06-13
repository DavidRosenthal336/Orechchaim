import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { DayView } from "@/components/day-view";
import { Logo } from "@/components/logo";

export default async function DayPage({
  params,
}: {
  params: Promise<{ dateKey: string }>;
}) {
  const { dateKey } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) redirect("/today");

  const user = await requireUser();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <header className="flex items-center gap-2 py-5">
        <Link
          href="/today"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-2"
          aria-label="Back to today"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <Logo />
      </header>
      <main className="flex-1 py-2 pb-10">
        <DayView user={user} dateKey={dateKey} />
      </main>
    </div>
  );
}
