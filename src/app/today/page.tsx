import Link from "next/link";
import { redirect } from "next/navigation";
import { ListChecks, Settings, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui";

export default async function TodayPage() {
  const user = await requireUser();
  if (user.role === "REBBE") redirect("/rebbe");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <AppHeader />
      <main className="flex-1 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Today</h1>
        <p className="mt-1 text-sm text-muted">
          {user.name ? `Welcome, ${user.name}` : `Signed in as ${user.email}`}
        </p>

        <Card className="mt-6">
          <p className="text-sm leading-relaxed text-muted">
            Your daily checklist will appear here once you&apos;ve built your
            checklists and assigned them to the days they belong on.
          </p>
        </Card>

        <nav className="mt-4 space-y-3">
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
