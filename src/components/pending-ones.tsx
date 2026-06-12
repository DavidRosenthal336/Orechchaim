import { DateTime } from "luxon";
import { decideOnes } from "@/app/actions/rebbe";
import { Card, Button } from "@/components/ui";
import { DAY_TYPE_LABELS, type DayType } from "@/lib/constants";

type PendingOne = {
  id: string;
  dateKey: string;
  hebrewDate: string | null;
  dayType: string;
  onesReason: string | null;
  completedCount: number;
  targetCount: number;
};

export function PendingOnes({ items }: { items: PendingOne[] }) {
  if (items.length === 0) {
    return (
      <Card className="text-center text-sm text-muted">
        No <span className="heb">אונס</span> requests waiting.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((o) => (
        <Card key={o.id} className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold">
              {DateTime.fromISO(o.dateKey).toFormat("cccc, LLL d")}
            </p>
            <p className="text-xs text-muted">
              {DAY_TYPE_LABELS[o.dayType as DayType] ?? o.dayType} ·{" "}
              {o.completedCount}/{o.targetCount}
            </p>
          </div>
          {o.onesReason ? (
            <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm leading-relaxed">
              “{o.onesReason}”
            </p>
          ) : null}
          <div className="flex gap-2">
            <form action={decideOnes} className="flex-1">
              <input type="hidden" name="dayEntryId" value={o.id} />
              <input type="hidden" name="decision" value="accept" />
              <Button type="submit" size="sm" className="w-full">
                Accept
              </Button>
            </form>
            <form action={decideOnes} className="flex-1">
              <input type="hidden" name="dayEntryId" value={o.id} />
              <input type="hidden" name="decision" value="deny" />
              <Button type="submit" variant="secondary" size="sm" className="w-full">
                Deny
              </Button>
            </form>
          </div>
        </Card>
      ))}
    </div>
  );
}
