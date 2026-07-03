import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { getTemplatesForUser } from "@/lib/queries";
import { createTemplate } from "@/app/actions/templates";
import { Card, Button } from "@/components/ui";
import { DAY_TYPE_LABELS, ASSIGNABLE_DAY_TYPES, type DayType } from "@/lib/constants";

export default async function ChecklistsPage() {
  const user = await requireUser();
  const templates = await getTemplatesForUser(user.id);

  const assigned = new Set<string>();
  for (const t of templates) for (const a of t.assignments) assigned.add(a.dayType);
  const unassigned = ASSIGNABLE_DAY_TYPES.filter(
    (d) => d !== "SPECIAL" && !assigned.has(d),
  );

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
        <h1 className="text-xl font-bold tracking-tight">Checklists</h1>
      </header>

      <main className="flex-1 space-y-5 pb-10">
        <p className="text-sm text-muted">
          Build a checklist and assign it to the days it should appear on. Each
          day-type uses one checklist.
        </p>

        {templates.length > 0 ? (
          <div className="space-y-3">
            {templates.map((t) => (
              <Link key={t.id} href={`/checklists/${t.id}`} className="block">
                <Card className="flex items-center justify-between gap-3 transition-colors hover:bg-surface-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {t._count.items} item{t._count.items === 1 ? "" : "s"}
                    </p>
                    {t.assignments.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {t.assignments.map((a) => (
                          <span
                            key={a.id}
                            className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
                          >
                            {DAY_TYPE_LABELS[a.dayType as DayType] ?? a.dayType}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-warning">
                        Not assigned to any day yet
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-muted">
              No checklists yet. Create your first one below.
            </p>
          </Card>
        )}

        {unassigned.length > 0 && templates.length > 0 ? (
          <p className="text-xs text-muted">
            No checklist yet for:{" "}
            {unassigned.map((d) => DAY_TYPE_LABELS[d]).join(", ")}.
          </p>
        ) : null}

        <Card>
          <form action={createTemplate} className="flex items-center gap-2">
            <input
              name="name"
              required
              maxLength={80}
              placeholder="New checklist name…"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base"
            />
            <Button type="submit" className="shrink-0">
              <Plus className="h-5 w-5" />
              <span className="sr-only">Create</span>
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
