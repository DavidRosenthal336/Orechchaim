"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createSpecialEvent } from "@/app/actions/day";
import { Button } from "@/components/ui";

export function SpecialEventForm({ dateKey }: { dateKey: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<number[]>([0, 1, 2]);
  const [nextId, setNextId] = useState(3);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-accent hover:underline"
      >
        It&apos;s a special event today
      </button>
    );
  }

  return (
    <form action={createSpecialEvent} className="space-y-4">
      <input type="hidden" name="dateKey" value={dateKey} />

      <div>
        <label htmlFor="eventName" className="mb-1.5 block text-sm font-medium">
          What&apos;s the event? <span className="text-muted">(required)</span>
        </label>
        <input
          id="eventName"
          name="eventName"
          required
          maxLength={120}
          placeholder="e.g. a chasunah, a trip, a yahrzeit…"
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base"
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">Today&apos;s checklist</p>
        <div className="space-y-2">
          {rows.map((id) => (
            <div key={id} className="flex items-center gap-2">
              <input
                name="items"
                maxLength={200}
                placeholder="Add an item…"
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              />
              <button
                type="button"
                aria-label="Remove item"
                onClick={() => setRows((r) => r.filter((x) => x !== id))}
                className="shrink-0 rounded-lg p-2 text-muted hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setRows((r) => [...r, nextId]);
            setNextId((n) => n + 1);
          }}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          <Plus className="h-4 w-4" /> Add item
        </button>
      </div>

      <div>
        <label htmlFor="target" className="mb-1.5 block text-sm font-medium">
          Daily target
        </label>
        <input
          id="target"
          name="target"
          type="number"
          min={0}
          defaultValue={0}
          className="h-11 w-24 rounded-xl border border-border bg-surface px-3 text-base"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm">
          Start special day
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-muted hover:underline"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-muted">
        This list is just for today — it won&apos;t be saved as a reusable
        checklist. It appears in your history and weekly report under the event
        name.
      </p>
    </form>
  );
}
