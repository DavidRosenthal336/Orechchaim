"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleItem, setItemOnes } from "@/app/actions/day";
import { ProgressRing } from "@/components/progress-ring";
import { cn } from "@/lib/utils";

export type ChecklistItemView = {
  id: string; // ItemCheck id
  label: string;
  checked: boolean;
  ones: boolean;
  hebrew: boolean;
};

type Update =
  | { id: string; kind: "checked"; value: boolean }
  | { id: string; kind: "ones"; value: boolean };

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
  const [optimisticItems, applyOptimistic] = useOptimistic(
    items,
    (state, u: Update) =>
      state.map((it) => {
        if (it.id !== u.id) return it;
        if (u.kind === "checked") {
          return { ...it, checked: u.value, ones: u.value ? false : it.ones };
        }
        return { ...it, ones: u.value, checked: u.value ? false : it.checked };
      }),
  );

  const completed = optimisticItems.filter((it) => it.checked).length;
  const onesCount = optimisticItems.filter((it) => it.ones).length;
  const effectiveTarget = Math.max(0, target - onesCount);

  function onToggleDone(id: string, next: boolean) {
    if (!editable) return;
    startTransition(async () => {
      applyOptimistic({ id, kind: "checked", value: next });
      await toggleItem(dayEntryId, id, next);
    });
  }

  function onToggleOnes(id: string, next: boolean) {
    if (!editable) return;
    startTransition(async () => {
      applyOptimistic({ id, kind: "ones", value: next });
      await setItemOnes(dayEntryId, id, next);
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-center">
        <ProgressRing value={completed} max={effectiveTarget} />
      </div>
      {onesCount > 0 ? (
        <p className="mb-4 text-center text-xs text-warning">
          {onesCount} excused (<span className="heb">אונס</span>)
        </p>
      ) : (
        <div className="mb-4" />
      )}

      <ul className="space-y-2.5">
        {optimisticItems.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-3 transition-colors",
              item.ones && "opacity-70",
            )}
          >
            <button
              type="button"
              disabled={!editable || item.ones}
              onClick={() => onToggleDone(item.id, !item.checked)}
              className="flex flex-1 items-center gap-3 text-left"
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
                  item.ones && "text-muted line-through decoration-warning",
                )}
                dir={item.hebrew ? "rtl" : undefined}
              >
                {item.label}
              </span>
            </button>

            <button
              type="button"
              disabled={!editable}
              onClick={() => onToggleOnes(item.id, !item.ones)}
              aria-pressed={item.ones}
              className={cn(
                "heb shrink-0 rounded-lg px-2.5 py-1 text-sm font-medium transition-colors",
                item.ones
                  ? "bg-warning-soft text-warning"
                  : "text-muted hover:bg-surface-2",
              )}
              title="Mark as אונס (excused — won't count against you)"
            >
              אונס
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
