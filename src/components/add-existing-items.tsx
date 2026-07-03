"use client";

import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { addExistingItems } from "@/app/actions/templates";
import { cn } from "@/lib/utils";

/// A multi-select picker of items that already exist on the user's other
/// checklists. Tap to select several, then add them all to this checklist at
/// once. Copies the label (a fresh item), so later edits stay independent.
export function AddExistingItems({
  templateId,
  templateName,
  available,
}: {
  templateId: string;
  templateName: string;
  available: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  if (available.length === 0) return null;

  function toggle(label: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function reset() {
    setOpen(false);
    setSelected(new Set());
  }

  function add() {
    if (selected.size === 0) return;
    const fd = new FormData();
    fd.set("templateId", templateId);
    for (const label of selected) fd.append("labels", label);
    startTransition(async () => {
      await addExistingItems(fd);
      reset();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
      >
        <Plus className="h-4 w-4" /> Add from other checklists
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface-2/40 p-2">
      <p className="px-1 text-xs text-muted">
        Tap items to add, then “Add to {templateName}”.
      </p>
      <ul className="max-h-72 space-y-1 overflow-y-auto">
        {available.map((label) => {
          const on = selected.has(label);
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => toggle(label)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors",
                  on
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface hover:bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                    on ? "border-accent bg-accent text-white" : "border-border",
                  )}
                >
                  {on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                </span>
                <span dir="ltr" className="min-w-0 flex-1 break-words leading-snug">
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={add}
          disabled={selected.size === 0 || isPending}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending
            ? "Adding…"
            : selected.size > 0
              ? `Add ${selected.size} to ${templateName}`
              : `Add to ${templateName}`}
        </button>
        <button
          type="button"
          onClick={reset}
          className="text-sm text-muted hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
