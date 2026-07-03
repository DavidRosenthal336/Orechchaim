import { DateTime } from "luxon";
import type { BoardDay, DayBoardStatus } from "@/lib/progress";
import { cn } from "@/lib/utils";

const STATUS: Record<DayBoardStatus, { label: string; cls: string }> = {
  FILLED: { label: "Filled in", cls: "bg-positive-soft text-positive" },
  OPEN: { label: "Open", cls: "bg-accent-soft text-accent" },
  MISSED: { label: "Not filled in", cls: "bg-surface-2 text-muted" },
  UPCOMING: { label: "—", cls: "text-muted" },
  ASSUR_WAIT: { label: "—", cls: "text-muted" },
  NO_CHECKLIST: { label: "—", cls: "text-muted" },
};

export function WeekBoard({ days }: { days: BoardDay[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {days.map((d) => {
        const s = STATUS[d.status];
        const dow = DateTime.fromISO(d.dateKey).toFormat("ccc");
        const showCount = d.status === "FILLED";
        return (
          <li
            key={d.dateKey}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {dow}{" "}
                <span className="text-muted">
                  {DateTime.fromISO(d.dateKey).toFormat("MMM d")}
                </span>
              </p>
              <p className="truncate text-xs text-muted">
                {d.label}
                {d.onesCount > 0 ? ` · ${d.onesCount} excused` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {showCount && d.total > 0 ? (
                <span className="text-xs tabular-nums text-muted">
                  {d.completed}/{d.total} done
                </span>
              ) : null}
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  s.cls,
                )}
              >
                {s.label}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
