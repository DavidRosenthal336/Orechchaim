"use client";

import { useActionState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { updateSettings, type SettingsState } from "@/app/actions/settings";
import {
  addRecipient,
  removeRecipient,
  type RecipientState,
} from "@/app/actions/recipients";
import { Card, Button } from "@/components/ui";
import { Switch } from "@/components/switch";

type Recipient = { id: string; name: string | null; email: string };

type Props = {
  timezones: string[];
  initial: {
    name: string;
    timezone: string;
    inIsrael: boolean;
    beinHazmanimMode: boolean;
  };
  recipients: Recipient[];
};

const initialState: SettingsState = {};
const initialRecipient: RecipientState = {};

export function SettingsForm({ timezones, initial, recipients }: Props) {
  const [state, action, pending] = useActionState(updateSettings, initialState);
  const [recipientState, recipientAction, recipientPending] = useActionState(
    addRecipient,
    initialRecipient,
  );

  // Clear the add-recipient inputs after a successful add.
  const addFormRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (recipientState.ok) addFormRef.current?.reset();
  }, [recipientState]);

  return (
    <div className="space-y-5">
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
              description="While on, weekdays and Sundays use your Bein Hazmanim checklist (set it under Checklists → “Bein Hazmanim”; if unset, it falls back to your Sunday list). Turn it off when the zman resumes."
            />
          </div>
        </details>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </Button>
          {state.ok ? (
            <span className="text-sm text-positive">Saved.</span>
          ) : null}
          {state.error ? (
            <span className="text-sm text-danger">{state.error}</span>
          ) : null}
        </div>
      </form>

      {/* Weekly report recipients (rebbeim). */}
      <Card className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Send my weekly report to
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Add a rebbe and your weekly report is emailed straight to them. A
            copy always comes to you too. Leave empty to just get it yourself
            and forward it.
          </p>
        </div>

        {recipients.length > 0 ? (
          <ul className="space-y-2">
            {recipients.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2"
              >
                <div className="min-w-0">
                  {r.name ? (
                    <p className="truncate text-sm font-medium">{r.name}</p>
                  ) : null}
                  <p className="truncate text-xs text-muted">{r.email}</p>
                </div>
                <form action={removeRecipient}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    aria-label="Remove recipient"
                    className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}

        <form ref={addFormRef} action={recipientAction} className="space-y-2">
          <input
            name="name"
            maxLength={80}
            placeholder="Rebbe's name (optional)"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          />
          <div className="flex items-center gap-2">
            <input
              name="email"
              type="email"
              required
              inputMode="email"
              placeholder="rebbe@example.com"
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="shrink-0"
              disabled={recipientPending}
            >
              {recipientPending ? "Adding…" : "Add"}
            </Button>
          </div>
          {recipientState.error ? (
            <p className="text-xs text-danger">{recipientState.error}</p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
