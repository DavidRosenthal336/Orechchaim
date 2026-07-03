import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { getTemplateForUser, getTemplatesForUser } from "@/lib/queries";
import { archiveTemplate, addItem } from "@/app/actions/templates";
import { Card, Button } from "@/components/ui";
import { SortableItems } from "@/components/sortable-items";
import { AddExistingItems } from "@/components/add-existing-items";
import {
  TemplateMetaForm,
  AssignmentsForm,
  type AssignmentRow,
} from "@/components/template-forms";
import {
  ASSIGNABLE_DAY_TYPES,
  DAY_TYPE_LABELS,
  DAY_TYPE_HINTS,
} from "@/lib/constants";

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

  // Distinct item labels that exist on the user's other checklists and aren't
  // already on this one — offered as quick "add from other checklists" picks.
  const currentLabels = new Set(template.items.map((i) => i.label));
  const seen = new Set<string>();
  const availableLabels: string[] = [];
  for (const t of allTemplates) {
    for (const it of t.items) {
      if (currentLabels.has(it.label) || seen.has(it.label)) continue;
      seen.add(it.label);
      availableLabels.push(it.label);
    }
  }

  const assignmentRows: AssignmentRow[] = ASSIGNABLE_DAY_TYPES.map((dayType) => {
    const owner = ownerByDayType.get(dayType);
    const elsewhere = owner && owner.id !== template.id;
    return {
      dayType,
      label: DAY_TYPE_LABELS[dayType],
      hint: DAY_TYPE_HINTS[dayType],
      checked: owner?.id === template.id,
      movesFrom: elsewhere ? owner!.name : undefined,
    };
  });

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
        {/* Name */}
        <TemplateMetaForm templateId={template.id} name={template.name} />

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
              dir="ltr"
              placeholder="Add an item…"
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            />
            <Button type="submit" size="sm" className="shrink-0">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add</span>
            </Button>
          </form>

          <AddExistingItems
            templateId={template.id}
            templateName={template.name}
            available={availableLabels}
          />
        </Card>

        {/* Day-type assignment */}
        <AssignmentsForm templateId={template.id} rows={assignmentRows} />

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
