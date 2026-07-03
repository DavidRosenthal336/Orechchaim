"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleItem, setItemOnes } from "@/app/actions/day";
import { cn } from "@/lib/utils";

export type ChecklistItemView = {
  id: string; // ItemCheck id
  label: string;
  checked: boolean;
  ones: boolean;
  onesReason: string | null;
  hebrew: boolean;
};

type Update =
  | { id: string; kind: "checked"; value: boolean }
  | { id: string; kind: "ones"; value: boolean; reason?: string };

export function DayChecklist({
  dayEntryId,
  items,
  editable,
}: {
  dayEntryId: string;
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
        return {
          ...it,
          ones: u.value,
          onesReason: u.value ? (u.reason ?? it.onesReason) : null,
          checked: u.value ? false : it.checked,
        };
      }),
  );

  // Which item is currently being asked for an אונס reason, and the draft text.
  const [promptId, setPromptId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const total = optimisticItems.length;
  const completed = optimisticItems.filter((it) => it.checked).length;
  const onesCount = optimisticItems.filter((it) => it.ones).length;

  function onToggleDone(id: string, next: boolean) {
    if (!editable) return;
    if (promptId === id) cancelOnes();
    startTransition(async () => {
      applyOptimistic({ id, kind: "checked", value: next });
      await toggleItem(dayEntryId, id, next);
    });
  }

  function onOnesButton(item: ChecklistItemView) {
    if (!editable) return;
    if (item.ones) {
      // Clearing אונס needs no reason.
      startTransition(async () => {
        applyOptimistic({ id: item.id, kind: "ones", value: false });
        await setItemOnes(dayEntryId, item.id, false);
      });
    } else {
      // Marking אונס requires a reason — open the prompt.
      setPromptId(item.id);
      setDraft("");
    }
  }

  function confirmOnes(id: string) {
    const reason = draft.trim();
    if (!reason) return;
    setPromptId(null);
    setDraft("");
    startTransition(async () => {
      applyOptimistic({ id, kind: "ones", value: true, reason });
      await setItemOnes(dayEntryId, id, true, reason);
    });
  }

  function cancelOnes() {
    setPromptId(null);
    setDraft("");
  }

  return (
    <div>
      <div className="mb-4 text-center">
        <p className="text-3xl font-bold leading-none tabular-nums">
          {completed}
          <span className="text-lg font-normal text-muted"> of {total} done</span>
        </p>
        {onesCount > 0 ? (
          <p className="mt-1.5 text-xs text-warning">
            {onesCount} excused (<span className="heb">אונס</span>)
          </p>
        ) : null}
      </div>

      <ul className="space-y-2.5">
        {optimisticItems.map((item) => (
          <li
            key={item.id}
            className={cn(
              "rounded-2xl border border-border bg-surface px-3 py-3 transition-colors",
              item.ones && "opacity-80",
            )}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!editable || item.ones}
                onClick={() => onToggleDone(item.id, !item.checked)}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    item.checked
                      ? "border-positive bg-positive text-white"
                      : "border-border",
                  )}
                >
                  {item.checked ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 whitespace-pre-wrap break-words text-left text-[15px] leading-snug",
                    item.checked && "text-muted line-through",
                    item.ones && "text-muted line-through decoration-warning",
                  )}
                  dir="ltr"
                >
                  {item.label}
                </span>
              </button>

              <button
                type="button"
                disabled={!editable}
                onClick={() => onOnesButton(item)}
                aria-pressed={item.ones}
                className={cn(
                  "heb shrink-0 rounded-lg px-2.5 py-1 text-sm font-medium transition-colors",
                  item.ones
                    ? "bg-warning-soft text-warning"
                    : "text-muted hover:bg-surface-2",
                )}
                title="Mark as אונס (excused — a reason is required)"
              >
                אונס
              </button>
            </div>

            {/* Existing אונס reason. */}
            {item.ones && item.onesReason && promptId !== item.id ? (
              <p className="mt-2 pl-9 text-xs text-muted">
                <span className="heb font-medium text-warning">אונס</span> —{" "}
                <span dir="ltr">{item.onesReason}</span>
              </p>
            ) : null}

            {/* Reason prompt — mandatory before אונס takes effect. */}
            {promptId === item.id ? (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <label className="block text-xs font-medium text-muted">
                  Why <span className="heb">אונס</span> for this? (required)
                </label>
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmOnes(item.id);
                    } else if (e.key === "Escape") {
                      cancelOnes();
                    }
                  }}
                  maxLength={300}
                  dir="ltr"
                  placeholder="e.g. away at a chasunah, not feeling well…"
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => confirmOnes(item.id)}
                    disabled={draft.trim().length === 0}
                    className="heb rounded-lg bg-warning-soft px-3 py-1.5 text-sm font-medium text-warning disabled:opacity-50"
                  >
                    Mark אונס
                  </button>
                  <button
                    type="button"
                    onClick={cancelOnes}
                    className="text-sm text-muted hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
