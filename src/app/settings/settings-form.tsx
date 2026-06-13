"use client";

import { useActionState } from "react";
import { updateSettings, type SettingsState } from "@/app/actions/settings";
import { Card, Button } from "@/components/ui";
import { Switch } from "@/components/switch";

type Props = {
  timezones: string[];
  initial: {
    name: string;
    timezone: string;
    inIsrael: boolean;
    beinHazmanimMode: boolean;
  };
};

const initialState: SettingsState = {};

export function SettingsForm({ timezones, initial }: Props) {
  const [state, action, pending] = useActionState(updateSettings, initialState);

  return (
    <form action={action} className="space-y-5">
      <Card className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            Your name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={initial.name}
            placeholder="Optional"
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base"
          />
        </div>

        <div>
          <label htmlFor="timezone" className="mb-1.5 block text-sm font-medium">
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            defaultValue={initial.timezone}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted">
            Sets when your day rolls over.
          </p>
        </div>

        <Switch
          name="inIsrael"
          defaultChecked={initial.inIsrael}
          label="I'm in Eretz Yisrael"
          description="Uses the Israel yom-tov schedule (one day) instead of Diaspora."
        />
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-foreground">Weekly report</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Each week you&apos;ll get an email summarizing your week — forward it
          to your rebbe.
        </p>
      </Card>

      {/* Advanced — deliberately collapsed and low-key. */}
      <details className="rounded-2xl border border-border bg-surface px-5">
        <summary className="cursor-pointer list-none py-4 text-sm font-medium text-muted">
          Advanced
        </summary>
        <div className="border-t border-border py-5">
          <Switch
            name="beinHazmanimMode"
            defaultChecked={initial.beinHazmanimMode}
            label="Bein Hazmanim mode"
            description="While on, ordinary weekdays use your Sunday/Friday checklist. Shabbos and Yom Tov are unaffected. Turn it off when the zman resumes."
          />
        </div>
      </details>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {state.ok ? <span className="text-sm text-positive">Saved.</span> : null}
        {state.error ? (
          <span className="text-sm text-danger">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
