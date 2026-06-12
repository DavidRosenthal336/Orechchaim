import Link from "next/link";
import { redirect } from "next/navigation";
import { ListChecks, Settings, ChevronRight, Moon } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { todayKey, formatCivilDate } from "@/lib/calendar";
import { getCatchUpDays } from "@/lib/day";
import { DayView } from "@/components/day-view";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui";

export default async function TodayPage() {
  const user = await requireUser();
  if (user.role === "REBBE") redirect("/rebbe");

  const dateKey = todayKey(user.timezone);
  const catchUp = await getCatchUpDays(user);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <AppHeader />
      <main className="flex-1 py-2 pb-10">
        <DayView user={user} dateKey={dateKey} />

        {catchUp.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-2 text-sm font-semibold text-muted">
              Still to fill in
            </h2>
            <div className="space-y-2">
              {catchUp.map((d) => (
                <Link key={d.dateKey} href={`/day/${d.dateKey}`}>
                  <Card className="flex items-center justify-between gap-3 transition-colors hover:bg-surface-2">
                    <span className="flex items-center gap-3">
                      {d.isAssurMelacha ? (
                        <Moon className="h-5 w-5 text-accent" />
                      ) : null}
                      <span>
                        <span className="block font-medium">{d.label}</span>
                        <span className="block text-xs text-muted">
                          {formatCivilDate(d.dateKey)}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted" />
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <nav className="mt-8 space-y-3 border-t border-border pt-6">
          <Link href="/checklists">
            <Card className="flex items-center justify-between gap-3 transition-colors hover:bg-surface-2">
              <span className="flex items-center gap-3">
                <ListChecks className="h-5 w-5 text-accent" />
                <span className="font-medium">My checklists</span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted" />
            </Card>
          </Link>
          <Link href="/settings">
            <Card className="flex items-center justify-between gap-3 transition-colors hover:bg-surface-2">
              <span className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-accent" />
                <span className="font-medium">Settings</span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted" />
            </Card>
          </Link>
        </nav>
      </main>
    </div>
  );
}
