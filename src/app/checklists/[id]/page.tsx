import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { getTemplateForUser, getTemplatesForUser } from "@/lib/queries";
import {
  updateTemplateMeta,
  archiveTemplate,
  addItem,
  setAssignments,
} from "@/app/actions/templates";
import { Card, Button } from "@/components/ui";
import { SortableItems } from "@/components/sortable-items";
import { ASSIGNABLE_DAY_TYPES, DAY_TYPE_LABELS } from "@/lib/constants";

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const template = await getTemplateForUser(user.id, id);
  if (!template) redirect("/checklists");

  const allTemplates = await getTemplatesForUser(user.id);
  const ownerByDayType = new Map<string, { id: string; name: string }>();
  for (const t of allTemplates) {
    for (const a of t.assignments) {
      ownerByDayType.set(a.dayType, { id: t.id, name: t.name });
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <header className="flex items-center gap-2 py-5">
        <Link
          href="/checklists"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-2"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="truncate text-xl font-bold tracking-tight">
          {template.name}
        </h1>
      </header>

      <main className="flex-1 space-y-5 pb-10">
        {/* Name + daily target */}
        <Card>
          <form action={updateTemplateMeta} className="space-y-4">
            <input type="hidden" name="templateId" value={template.id} />
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                Checklist name
              </label>
              <input
                id="name"
                name="name"
                defaultValue={template.name}
                maxLength={80}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base"
              />
            </div>
            <div>
              <label
                htmlFor="targetCount"
                className="mb-1.5 block text-sm font-medium"
              >
                Daily target
              </label>
              <input
                id="targetCount"
                name="targetCount"
                type="number"
                min={0}
                max={template.items.length}
                defaultValue={template.targetCount}
                className="h-11 w-24 rounded-xl border border-border bg-surface px-3 text-base"
              />
              <p className="mt-1.5 text-xs text-muted">
                A good day = at least this many of {template.items.length} item
                {template.items.length === 1 ? "" : "s"} done. An accepted{" "}
                <span className="heb">אונס</span> counts a short day as good.
              </p>
            </div>
            <Button type="submit" size="sm">
              Save
            </Button>
          </form>
        </Card>

        {/* Items */}
        <Card className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-muted">Items</h2>
            {template.items.length > 1 ? (
              <span className="text-xs text-muted">Drag ⋮⋮ to reorder</span>
            ) : null}
          </div>

          <SortableItems
            templateId={template.id}
            items={template.items.map((i) => ({ id: i.id, label: i.label }))}
          />

          <form
            action={addItem}
            className="flex items-center gap-2 border-t border-border pt-3"
          >
            <input type="hidden" name="templateId" value={template.id} />
            <input
              name="label"
              required
              maxLength={200}
              placeholder="Add an item…"
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            />
            <Button type="submit" size="sm" className="shrink-0">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add</span>
            </Button>
          </form>
        </Card>

        {/* Day-type assignment */}
        <Card>
          <form action={setAssignments} className="space-y-3">
            <input type="hidden" name="templateId" value={template.id} />
            <h2 className="text-sm font-semibold text-muted">
              Show this checklist on
            </h2>
            <div className="space-y-2">
              {ASSIGNABLE_DAY_TYPES.map((dayType) => {
                const owner = ownerByDayType.get(dayType);
                const here = owner?.id === template.id;
                const elsewhere = owner && owner.id !== template.id;
                return (
                  <label
                    key={dayType}
                    className="flex items-center gap-3 rounded-lg px-1 py-1.5"
                  >
                    <input
                      type="checkbox"
                      name="dayTypes"
                      value={dayType}
                      defaultChecked={here}
                      className="h-5 w-5 rounded border-border accent-[var(--accent)]"
                    />
                    <span className="text-sm">
                      {DAY_TYPE_LABELS[dayType]}
                      {dayType === "SPECIAL" ? (
                        <span className="text-muted"> (manual override)</span>
                      ) : null}
                      {elsewhere ? (
                        <span className="text-xs text-warning">
                          {" "}
                          — moves from {owner!.name}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
            <Button type="submit" size="sm">
              Save assignments
            </Button>
          </form>
        </Card>

        {/* Delete */}
        <form action={archiveTemplate}>
          <input type="hidden" name="templateId" value={template.id} />
          <button
            type="submit"
            className="text-sm font-medium text-danger hover:underline"
          >
            Delete this checklist
          </button>
        </form>
      </main>
    </div>
  );
}
