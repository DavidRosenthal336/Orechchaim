import Link from "next/link";
import { DateTime } from "luxon";
import { ensureDayEntry, loadDay } from "@/lib/day";
import { formatCivilDate } from "@/lib/calendar";
import { DAY_TYPE_LABELS } from "@/lib/constants";
import { submitDay, reopenDay } from "@/app/actions/day";
import { DayChecklist } from "@/components/day-checklist";
import { SpecialEventForm } from "@/components/special-event-form";
import { Card, Button, ButtonLink } from "@/components/ui";
import { isHebrew } from "@/lib/utils";

type DayUser = {
  id: string;
  timezone: string;
  inIsrael: boolean;
  beinHazmanimMode: boolean;
  beinHazmanimTargetType: string;
};

export async function DayView({
  user,
  dateKey,
}: {
  user: DayUser;
  dateKey: string;
}) {
  const settings = {
    id: user.id,
    timezone: user.timezone,
    inIsrael: user.inIsrael,
    beinHazmanimMode: user.beinHazmanimMode,
    beinHazmanimTargetType: user.beinHazmanimTargetType,
  };

  let loaded = await loadDay(settings, dateKey);
  if (loaded.window.state === "OPEN" && !loaded.entry && loaded.template) {
    await ensureDayEntry(settings, dateKey);
    loaded = await loadDay(settings, dateKey);
  }

  const { resolution, effectiveDayType, entry, window } = loaded;
  const holiday = resolution.holidays[0];

  const header = (
    <div className="mb-6">
      <p className="text-sm text-muted">{formatCivilDate(dateKey)}</p>
      <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
        {entry?.eventName ?? DAY_TYPE_LABELS[effectiveDayType]}
      </h1>
      <p className="mt-1 text-sm text-muted">
        <span className="heb">{resolution.hebrewDateHe}</span>
        {holiday ? ` · ${holiday}` : ""}
        {resolution.beinHazmanimApplied && effectiveDayType !== "BEIN_HAZMANIM"
          ? " · Bein Hazmanim"
          : ""}
      </p>
    </div>
  );

  // No checklist assigned for this day-type.
  if (!entry && !loaded.template) {
    return (
      <div>
        {header}
        <Card className="space-y-4 text-center">
          <p className="text-sm text-muted">
            You don&apos;t have a checklist for{" "}
            {DAY_TYPE_LABELS[effectiveDayType]} days yet.
          </p>
          <ButtonLink href="/checklists" size="sm">
            Set up a checklist
          </ButtonLink>
        </Card>
        {window.state === "OPEN" ? (
          <Card className="mt-3">
            <SpecialEventForm dateKey={dateKey} />
          </Card>
        ) : null}
      </div>
    );
  }

  // Shabbos / Yom Tov — comes back Motzei.
  if (window.state === "ASSUR_WAIT" && window.unlocksAt) {
    const unlock = DateTime.fromJSDate(window.unlocksAt, {
      zone: user.timezone,
    }).toFormat("cccc 'at' h:mm a");
    return (
      <div>
        {header}
        <Card className="text-center">
          <p className="text-sm leading-relaxed text-muted">
            Enjoy {DAY_TYPE_LABELS[effectiveDayType]}. This checklist opens
            Motzei — around <span className="font-medium text-foreground">{unlock}</span>{" "}
            — so you can fill it in honestly once you&apos;re able.
          </p>
        </Card>
      </div>
    );
  }

  if (window.state === "FUTURE") {
    return (
      <div>
        {header}
        <Card className="text-center text-sm text-muted">
          This day hasn&apos;t started yet.
        </Card>
      </div>
    );
  }

  if (!entry) {
    return (
      <div>
        {header}
        <Card className="text-center text-sm text-muted">
          This day is closed for entry.
        </Card>
      </div>
    );
  }

  const items = entry.checks.map((c) => ({
    id: c.id,
    label: c.itemLabel,
    checked: c.checked,
    ones: c.ones,
    onesReason: c.onesReason,
    hebrew: isHebrew(c.itemLabel),
  }));
  const editable = window.state === "OPEN" && entry.status !== "SUBMITTED";
  const submitted = entry.status === "SUBMITTED";
  const closed = window.state !== "OPEN";

  return (
    <div>
      {header}

      <DayChecklist dayEntryId={entry.id} items={items} editable={editable} />

      <div className="mt-6 space-y-4">
        {submitted ? (
          <Card className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Recorded 🌱</p>
              <p className="text-xs text-muted">
                {entry.completedCount} of {entry.checks.length} done
                {entry.onesRequested ? " · אונס excused" : ""}
              </p>
            </div>
            {window.state === "OPEN" ? (
              <form action={reopenDay}>
                <input type="hidden" name="dayEntryId" value={entry.id} />
                <Button type="submit" variant="secondary" size="sm">
                  Edit
                </Button>
              </form>
            ) : null}
          </Card>
        ) : editable ? (
          <form action={submitDay}>
            <input type="hidden" name="dayEntryId" value={entry.id} />
            <Button type="submit" size="lg" className="w-full">
              Submit today
            </Button>
          </form>
        ) : closed ? (
          <Card className="text-center text-sm text-muted">
            This day is closed — it can no longer be edited.
          </Card>
        ) : null}

        {editable ? (
          <div className="pt-1 text-center">
            <SpecialEventForm dateKey={dateKey} />
          </div>
        ) : null}

        <div className="pt-2 text-center">
          <Link href="/checklists" className="text-xs text-muted hover:underline">
            Manage checklists
          </Link>
        </div>
      </div>
    </div>
  );
}
