"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleItem } from "@/app/actions/day";
import { ProgressRing } from "@/components/progress-ring";
import { cn } from "@/lib/utils";

export type ChecklistItemView = {
  id: string; // ItemCheck id
  label: string;
  checked: boolean;
  hebrew: boolean;
};

export function DayChecklist({
  dayEntryId,
  target,
  items,
  editable,
}: {
  dayEntryId: string;
  target: number;
  items: ChecklistItemView[];
  editable: boolean;
}) {
  const [, startTransition] = useTransition();
  const [optimisticItems, setOptimistic] = useOptimistic(
    items,
    (state, { id, checked }: { id: string; checked: boolean }) =>
      state.map((it) => (it.id === id ? { ...it, checked } : it)),
  );

  const completed = optimisticItems.filter((it) => it.checked).length;

  function onToggle(id: string, next: boolean) {
    if (!editable) return;
    startTransition(async () => {
      setOptimistic({ id, checked: next });
      await toggleItem(dayEntryId, id, next);
    });
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-center">
        <ProgressRing value={completed} max={target} />
      </div>

      <ul className="space-y-2.5">
        {optimisticItems.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={!editable}
              onClick={() => onToggle(item.id, !item.checked)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-left transition-colors",
                editable && "hover:bg-surface-2",
                !editable && "opacity-80",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  item.checked
                    ? "border-positive bg-positive text-white"
                    : "border-border",
                )}
              >
                {item.checked ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
              </span>
              <span
                className={cn(
                  "text-[15px] leading-snug",
                  item.checked && "text-muted line-through",
                )}
                dir={item.hebrew ? "rtl" : undefined}
              >
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
