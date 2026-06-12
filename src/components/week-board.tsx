import { DateTime } from "luxon";
import type { BoardDay, DayBoardStatus } from "@/lib/rebbe";
import { cn } from "@/lib/utils";

const STATUS: Record<DayBoardStatus, { label: string; cls: string }> = {
  GOOD: { label: "Good", cls: "bg-positive-soft text-positive" },
  SHORT: { label: "Short", cls: "bg-danger-soft text-danger" },
  ONES_PENDING: { label: "אונס pending", cls: "bg-warning-soft text-warning" },
  OPEN: { label: "Open", cls: "bg-accent-soft text-accent" },
  MISSED: { label: "Missed", cls: "bg-surface-2 text-muted" },
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
              <p className="truncate text-xs text-muted">{d.label}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {d.target > 0 &&
              (d.status === "GOOD" ||
                d.status === "SHORT" ||
                d.status === "ONES_PENDING") ? (
                <span className="text-xs tabular-nums text-muted">
                  {d.completed}/{d.target}
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
